import { RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface GuestCreation {
  id: string;
  url: string;
  type?: "image" | "video" | null;
  timestamp?: number;
  prompt?: string;
  is_guest?: boolean;
  isGuest?: boolean;
  remix_type?: "paid" | "free" | null;
  remixType?: "paid" | "free" | null;
  parent_asset?: any;
  parentAsset?: any;
  original_url?: string;
  originalUrl?: string;
  clean_url?: string;
  cleanUrl?: string;
  watermarked_url?: string;
  watermarkedUrl?: string;
  registered_by_wallet?: string;
  registeredByWallet?: string;
  registered_ip_id?: string;
  registeredIpId?: string;
  guest_session_id?: string;
  guestSessionId?: string;
}

// --------------------- Supabase client (server) ---------------------
const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY; // use service role key on server

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars");
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// --------------------- Helpers ---------------------
const toDbRow = (creation: GuestCreation) => ({
  id: creation.id,
  url: creation.url,
  type: creation.type || "image",
  timestamp: creation.timestamp || Date.now(),
  prompt: creation.prompt || "",
  is_guest: creation.isGuest !== undefined ? creation.isGuest : true,
  remix_type: creation.remixType || creation.remix_type || null,
  parent_asset: creation.parentAsset || creation.parent_asset || null,
  original_url: creation.originalUrl || creation.original_url || null,
  clean_url: creation.cleanUrl || creation.clean_url || null,
  watermarked_url:
    creation.watermarkedUrl || creation.watermarked_url || null,
  registered_by_wallet:
    creation.registeredByWallet || creation.registered_by_wallet || null,
  registered_ip_id:
    creation.registeredIpId || creation.registered_ip_id || null,
  guest_session_id:
    creation.guestSessionId || creation.guest_session_id || null,
});

// --------------------- GET all guest creations ---------------------
export const handleGetGuestCreations: RequestHandler = async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ ok: false, error: "Supabase not configured" });
    }

    const { data: creations, error } = await supabase
      .from("guest_creations")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching guest creations from database:", error);
      return res.status(500).json({ ok: false, error: error.message || "Failed to fetch guest creations" });
    }

    const transformedCreations = (creations || []).map((creation: any) => ({
      id: creation.id,
      url: creation.url,
      type: creation.type,
      timestamp: creation.timestamp,
      prompt: creation.prompt,
      isGuest: creation.is_guest,
      remixType: creation.remix_type,
      parentAsset: creation.parent_asset,
      originalUrl: creation.original_url,
      cleanUrl: creation.clean_url,
      watermarkedUrl: creation.watermarked_url,
      registeredByWallet: creation.registered_by_wallet,
      registeredIpId: creation.registered_ip_id,
      guestSessionId: creation.guest_session_id,
    }));

    return res.json({ ok: true, creations: transformedCreations });
  } catch (err: any) {
    console.error("Error fetching guest creations:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed to fetch guest creations" });
  }
};

// --------------------- POST add guest creation ---------------------
export const handleAddGuestCreation: RequestHandler = async (req, res) => {
  try {
    const creation: GuestCreation = req.body;

    if (!creation?.id || !creation?.url) {
      return res.status(400).json({ ok: false, error: "Missing required fields: id, url" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ ok: false, error: "Supabase not configured" });
    }

    const dbData = toDbRow(creation);

    // Upsert the row (no .select() because we don't need returned data)
    const { error: upsertError } = await supabase
      .from("guest_creations")
      .upsert(dbData, { onConflict: "id" });

    if (upsertError) {
      console.error("Error saving guest creation to database:", upsertError);
      return res.status(500).json({ ok: false, error: upsertError.message || "Failed to save guest creation" });
    }

    // If URL is a data URL, upload to Supabase Storage and update DB with public URL
    if (typeof creation.url === "string" && creation.url.startsWith("data:")) {
      try {
        // data:[<mediatype>][;base64],<data>
        const [, base64Data] = creation.url.split(",");
        const header = creation.url.split(",")[0] || "";
        const mimeMatch = header.match(/data:(.*?);/);
        const mimeType = mimeMatch?.[1] || "image/png";
        const extension = mimeType.split("/")[1] || "png";

        const buffer = Buffer.from(base64Data, "base64");

        const timestamp = Date.now();
        const filePath = `${creation.id}/${timestamp}.${extension}`;

        // Upload to bucket 'guest_creation' — ensure bucket exists
        const { error: uploadError } = await supabase.storage
          .from("guest_creation")
          .upload(filePath, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: mimeType,
          });

        if (!uploadError) {
          // Get public URL
          const { data: urlData, error: urlError } = await supabase.storage
            .from("guest_creation")
            .getPublicUrl(filePath);

          if (!urlError && urlData?.publicUrl) {
            const publicUrl = urlData.publicUrl;

            // Update DB with new URL
            const { error: updateError } = await supabase
              .from("guest_creations")
              .update({ url: publicUrl })
              .eq("id", creation.id);

            if (updateError) {
              console.warn("Uploaded to storage but failed to update DB url:", updateError);
            } else {
              // reflect change in response body
              creation.url = publicUrl;
            }
          } else {
            console.warn("Uploaded file but failed to get public URL:", urlError);
          }
        } else {
          console.warn("Failed to upload image to Supabase storage:", uploadError);
        }
      } catch (uploadErr) {
        console.warn("Error uploading image to Supabase storage:", uploadErr);
      }
    }

    return res.json({
      ok: true,
      message: "Creation saved successfully",
      creation,
    });
  } catch (err: any) {
    console.error("Failed to save guest creation:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed to save guest creation" });
  }
};

// --------------------- DELETE guest creation by id ---------------------
export const handleDeleteGuestCreation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing required parameter: id" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ ok: false, error: "Supabase not configured" });
    }

    const { error } = await supabase
      .from("guest_creations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting guest creation:", error);
      return res.status(500).json({ ok: false, error: error.message || "Failed to delete guest creation" });
    }

    return res.json({ ok: true, message: "Creation deleted successfully" });
  } catch (err: any) {
    console.error("Failed to delete guest creation:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed to delete guest creation" });
  }
};

// --------------------- CLEAR all guest creations (admin) ---------------------
export const handleClearGuestCreations: RequestHandler = async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ ok: false, error: "Supabase not configured" });
    }

    // Delete all rows
    const { error } = await supabase
      .from("guest_creations")
      .delete()
      .neq("id", ""); // delete where id != ''

    if (error) {
      console.error("Error clearing guest creations:", error);
      return res.status(500).json({ ok: false, error: error.message || "Failed to clear guest creations" });
    }

    return res.json({ ok: true, message: "All guest creations cleared" });
  } catch (err: any) {
    console.error("Failed to clear guest creations:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed to clear guest creations" });
  }
};

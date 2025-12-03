import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

interface GuestCreation {
  id: string;
  url: string;
  type: "image" | "video" | null;
  timestamp: number;
  prompt: string;
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

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

// GET /api/guest-creations - Fetch all guest creations from Supabase database
export const handleGetGuestCreations: RequestHandler = async (_req, res) => {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.error("Supabase not configured");
      return res.status(500).json({
        ok: false,
        error: "Supabase not configured",
      });
    }

    // Fetch all guest creations from database
    const { data: creations, error } = await supabase
      .from("guest_creations")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching guest creations from database:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Failed to fetch guest creations",
      });
    }

    // Transform snake_case to camelCase for backward compatibility
    const transformedCreations = (creations || []).map((creation) => ({
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

    res.json({ ok: true, creations: transformedCreations });
  } catch (error: any) {
    console.error("Error fetching guest creations:", error);
    res.status(500).json({
      ok: false,
      error: error?.message || "Failed to fetch guest creations",
    });
  }
};

// POST /api/guest-creations - Add a new guest creation to database
export const handleAddGuestCreation: RequestHandler = async (req, res) => {
  try {
    const creation: GuestCreation = req.body;

    if (!creation.id || !creation.url) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: id, url",
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: "Supabase not configured",
      });
    }

    // Prepare data for database (convert camelCase to snake_case)
    const dbData = {
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
    };

    // Upsert (insert or update) the creation
    const { data: upsertedData, error: upsertError } = await supabase
      .from("guest_creations")
      .upsert(dbData, { onConflict: "id" })
      .select();

    if (upsertError) {
      console.error("Error saving guest creation to database:", upsertError);
      return res.status(500).json({
        ok: false,
        error: upsertError.message || "Failed to save guest creation",
      });
    }

    // Attempt to upload image to Supabase storage if URL is a data URL
    if (creation.url && creation.url.startsWith("data:")) {
      try {
        const [header, base64Data] = creation.url.split(",");
        const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
        const extension = mimeType.split("/")[1] || "png";

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        const timestamp = Date.now();
        const filePath = `${creation.id}/${timestamp}.${extension}`;

        const { data, error } = await supabase.storage
          .from("guest_creation")
          .upload(filePath, blob, {
            cacheControl: "3600",
            upsert: false,
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from("guest_creation")
            .getPublicUrl(data.path);

          // Update the creation in database with the Supabase storage URL
          await supabase
            .from("guest_creations")
            .update({ url: urlData.publicUrl })
            .eq("id", creation.id);

          creation.url = urlData.publicUrl;
        } else {
          console.warn("Failed to upload image to Supabase storage:", error);
        }
      } catch (uploadError) {
        console.warn("Error uploading image to Supabase storage:", uploadError);
      }
    }

    res.json({
      ok: true,
      message: "Creation saved successfully",
      creation,
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Failed to save guest creation",
    });
  }
};

// DELETE /api/guest-creations/:id - Delete a guest creation from database
export const handleDeleteGuestCreation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Missing required parameter: id",
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: "Supabase not configured",
      });
    }

    // Delete the creation from database
    const { error } = await supabase
      .from("guest_creations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting guest creation:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Failed to delete guest creation",
      });
    }

    res.json({
      ok: true,
      message: "Creation deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Failed to delete guest creation",
    });
  }
};

// POST /api/guest-creations/clear - Clear all guest creations from database (admin only)
export const handleClearGuestCreations: RequestHandler = async (_req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: "Supabase not configured",
      });
    }

    // Delete all guest creations from database
    const { error } = await supabase
      .from("guest_creations")
      .delete()
      .neq("id", ""); // Delete where id is not empty (all records)

    if (error) {
      console.error("Error clearing guest creations:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Failed to clear guest creations",
      });
    }

    res.json({
      ok: true,
      message: "All guest creations cleared",
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || "Failed to clear guest creations",
    });
  }
};

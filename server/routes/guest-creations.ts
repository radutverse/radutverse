import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const GUEST_CREATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "guest-creations.json",
);

interface GuestCreation {
  id: string;
  url: string;
  type: "image" | "video" | null;
  timestamp: number;
  prompt: string;
  isGuest: boolean;
  remixType?: "paid" | "free" | null;
  parentAsset?: any;
  originalUrl?: string;
  registeredByWallet?: string;
  registeredIpId?: string;
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

// Ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(GUEST_CREATIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Load all guest creations
const loadGuestCreations = (): GuestCreation[] => {
  ensureDataDir();
  try {
    if (fs.existsSync(GUEST_CREATIONS_FILE)) {
      const data = fs.readFileSync(GUEST_CREATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("Failed to load guest creations:", error);
  }
  return [];
};

// Save guest creations
const saveGuestCreations = (creations: GuestCreation[]): void => {
  ensureDataDir();
  try {
    fs.writeFileSync(
      GUEST_CREATIONS_FILE,
      JSON.stringify(creations, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("Failed to save guest creations:", error);
    throw error;
  }
};

// GET /api/guest-creations - Fetch all guest creations from Supabase
export const handleGetGuestCreations: RequestHandler = async (_req, res) => {
  try {
    const supabase = getSupabaseClient();

    // If Supabase is not configured, fall back to local JSON file
    if (!supabase) {
      console.log(
        "Supabase not configured, falling back to local guest creations",
      );
      const creations = loadGuestCreations();
      return res.json({ ok: true, creations });
    }

    // Fetch guest creations metadata from local JSON file
    const metadataCreations = loadGuestCreations();

    // Create a map of creation IDs for quick lookup
    const metadataMap = new Map<string, GuestCreation>();
    metadataCreations.forEach((c) => {
      metadataMap.set(c.id, c);
    });

    // Fetch files from Supabase bucket
    const { data: files, error } = await supabase.storage
      .from("guest_creation")
      .list();

    if (error) {
      console.warn(
        "Error fetching from Supabase bucket, falling back to local",
        error,
      );
      return res.json({ ok: true, creations: metadataCreations });
    }

    // Build creations list from Supabase files and metadata
    const creations: GuestCreation[] = [];
    const processedIds = new Set<string>();

    if (files && Array.isArray(files)) {
      for (const file of files) {
        // Skip directories
        if (file.name.endsWith("/")) {
          continue;
        }

        // Extract creation ID from file path (format: creationId/timestamp.ext)
        const parts = file.name.split("/");
        if (parts.length < 2) {
          continue;
        }

        const creationId = parts[0];

        // Skip if we've already processed this creation ID
        if (processedIds.has(creationId)) {
          continue;
        }
        processedIds.add(creationId);

        // Get metadata from local file if available
        const metadata = metadataMap.get(creationId);

        if (metadata) {
          // Use metadata from local file and update URL from Supabase
          const { data: urlData } = supabase.storage
            .from("guest_creation")
            .getPublicUrl(file.name);

          creations.push({
            ...metadata,
            url: urlData.publicUrl,
          });
        } else {
          // Create minimal creation object from file
          const { data: urlData } = supabase.storage
            .from("guest_creation")
            .getPublicUrl(file.name);

          creations.push({
            id: creationId,
            url: urlData.publicUrl,
            type: file.name.endsWith(".mp4") ? "video" : "image",
            timestamp: file.updated_at
              ? new Date(file.updated_at).getTime()
              : Date.now(),
            prompt: "",
            isGuest: true,
          });
        }
      }
    }

    // Also include any metadata-only creations (in case metadata exists but file doesn't)
    for (const [creationId, metadata] of metadataMap) {
      if (!processedIds.has(creationId)) {
        creations.push(metadata);
      }
    }

    // Sort by timestamp descending (most recent first)
    creations.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ ok: true, creations });
  } catch (error: any) {
    console.error("Error fetching guest creations:", error);
    res.status(500).json({
      ok: false,
      error: error?.message || "Failed to fetch guest creations",
    });
  }
};

// POST /api/guest-creations - Add a new guest creation
export const handleAddGuestCreation: RequestHandler = async (req, res) => {
  try {
    const creation: GuestCreation = req.body;

    if (!creation.id || !creation.url) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: id, url",
      });
    }

    const creations = loadGuestCreations();

    // Check if creation already exists
    const existingIndex = creations.findIndex((c) => c.id === creation.id);
    if (existingIndex >= 0) {
      creations[existingIndex] = creation;
    } else {
      creations.unshift(creation);
    }

    saveGuestCreations(creations);

    // Attempt to upload image to Supabase if URL is a data URL
    const supabase = getSupabaseClient();
    if (supabase && creation.url && creation.url.startsWith("data:")) {
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

          // Update the creation with the Supabase URL
          creation.url = urlData.publicUrl;

          // Update creations list with new URL
          const index = creations.findIndex((c) => c.id === creation.id);
          if (index >= 0) {
            creations[index].url = urlData.publicUrl;
          }

          saveGuestCreations(creations);
        } else {
          console.warn("Failed to upload image to Supabase:", error);
        }
      } catch (uploadError) {
        console.warn("Error uploading image to Supabase:", uploadError);
        // Continue with local storage even if Supabase upload fails
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

// DELETE /api/guest-creations/:id - Delete a guest creation
export const handleDeleteGuestCreation: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Missing required parameter: id",
      });
    }

    const creations = loadGuestCreations();
    const filtered = creations.filter((c) => c.id !== id);

    if (filtered.length === creations.length) {
      return res.status(404).json({
        ok: false,
        error: "Creation not found",
      });
    }

    saveGuestCreations(filtered);

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

// POST /api/guest-creations/clear - Clear all guest creations (admin only)
export const handleClearGuestCreations: RequestHandler = (_req, res) => {
  try {
    saveGuestCreations([]);
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

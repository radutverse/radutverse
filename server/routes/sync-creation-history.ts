import { getBlob, put, list } from "@vercel/blob";
import type { RequestHandler } from "express";

const MAX_BLOB_SIZE = 4 * 1024 * 1024; // 4MB limit per Vercel Blob

// Helper to validate and sanitize blob key
const sanitizeBlobKey = (key: string): string => {
  // Allow alphanumeric, hyphens, underscores, and .json extension
  const sanitized = key.replace(/[^a-z0-9_\-\.]/g, "");
  return sanitized || "creation-history-default.json";
};

interface CreationHistoryData {
  creations: any[];
  lastSynced: number;
  version: number;
}

/**
 * Load creation history from Vercel Blob
 */
async function loadFromBlob(
  blobKey: string = "creation-history.json",
): Promise<CreationHistoryData | null> {
  try {
    const sanitizedKey = sanitizeBlobKey(blobKey);
    const { blobs } = await list({ prefix: sanitizedKey });

    if (blobs.length === 0) {
      console.log(`[Creation History Blob] No blob found for: ${sanitizedKey}`);
      return null;
    }

    // Ambil blob langsung (tanpa fetch URL)
    const { blob } = await getBlob(blobs[0].url);
    const text = await blob.text();

    return JSON.parse(text) as CreationHistoryData;
  } catch (error) {
    console.warn("[Creation History Blob] Error loading blob:", error);
    return null;
  }
}

    const content = await response.text();
    const parsed = JSON.parse(content) as CreationHistoryData;
    return parsed;
  } catch (error) {
    console.warn("[Creation History Blob] Error loading from blob:", error);
    return null;
  }
}

/**
 * Save creation history to Vercel Blob
 */
async function saveToBlob(
  data: CreationHistoryData,
  blobKey: string = "creation-history.json",
): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  const sanitizedKey = sanitizeBlobKey(blobKey);

  // Check blob size
  if (content.length > MAX_BLOB_SIZE) {
    console.warn(
      `[Creation History Blob] Data size ${content.length} exceeds limit, keeping only recent 100`,
    );
    // Keep only recent 100 creations to stay under limit
    data.creations = data.creations.slice(0, 100);
    const reducedContent = JSON.stringify(data, null, 2);
    if (reducedContent.length > MAX_BLOB_SIZE) {
      console.error("[Creation History Blob] Still too large after reduction");
      throw new Error("Creation history too large to store");
    }
  }

  try {
    await put(sanitizedKey, content, {
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    });

    console.log(
      `[Creation History Blob] Saved ${data.creations.length} creations to ${sanitizedKey}`,
    );
  } catch (error) {
    console.error("[Creation History Blob] Failed to save:", error);
    throw error;
  }
}

/**
 * Sync creation history - merge client data with blob data
 * Keeps the most recent version and deduplicates by creation ID
 */
export const handleSyncCreationHistory: RequestHandler = async (req, res) => {
  try {
    const { creations: clientCreations, blobKey } = req.body || {};

    if (!Array.isArray(clientCreations)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "creations must be an array",
      });
    }

    // Load existing data from blob using user-specific key
    const blobData = await loadFromBlob(blobKey);

    // Merge: client data takes precedence, but keep older items not in client
    const mergedCreations = clientCreations;
    const clientIds = new Set(clientCreations.map((c: any) => c.id));

    if (blobData) {
      // Add creations from blob that aren't in client (in case sync is out of date)
      for (const creation of blobData.creations) {
        if (!clientIds.has(creation.id)) {
          mergedCreations.push(creation);
        }
      }
    }

    // Sort by timestamp (newest first) and limit to 500
    mergedCreations.sort((a: any, b: any) => b.timestamp - a.timestamp);
    const limitedCreations = mergedCreations.slice(0, 500);

    // Save to blob with user-specific key
    const dataToSave: CreationHistoryData = {
      creations: limitedCreations,
      lastSynced: Date.now(),
      version: 1,
    };

    await saveToBlob(dataToSave, blobKey);

    console.log("[Creation History] Sync successful:", {
      clientCount: clientCreations.length,
      mergedCount: limitedCreations.length,
      blobKey,
      timestamp: new Date().toLocaleString(),
    });

    return res.status(200).json({
      ok: true,
      synced: limitedCreations.length,
      creations: limitedCreations,
      lastSynced: dataToSave.lastSynced,
    });
  } catch (error) {
    console.error("[Creation History] Sync failed:", error);
    return res.status(500).json({
      error: "sync_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get creation history from blob
 */
export const handleGetCreationHistory: RequestHandler = async (req, res) => {
  try {
    const { blobKey } = req.body || {};
    const data = await loadFromBlob(blobKey);

    if (!data) {
      return res.status(200).json({
        ok: true,
        creations: [],
        lastSynced: null,
      });
    }

    return res.status(200).json({
      ok: true,
      creations: data.creations,
      lastSynced: data.lastSynced,
    });
  } catch (error) {
    console.error("[Creation History] Get failed:", error);
    return res.status(500).json({
      error: "get_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

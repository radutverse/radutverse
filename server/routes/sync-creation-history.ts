import { put, get, list } from "@vercel/blob";
import type { RequestHandler } from "express";

const CREATION_HISTORY_BLOB_NAME = "creation-history.json";
const MAX_BLOB_SIZE = 4 * 1024 * 1024; // 4MB limit per Vercel Blob

interface CreationHistoryData {
  creations: any[];
  lastSynced: number;
  version: number;
}

/**
 * Load creation history from Vercel Blob
 */
async function loadFromBlob(): Promise<CreationHistoryData | null> {
  try {
    const { blobs } = await list({ prefix: CREATION_HISTORY_BLOB_NAME });

    if (blobs.length === 0) {
      console.log("[Creation History Blob] No creation history found");
      return null;
    }

    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);

    if (!response.ok) {
      console.warn(
        `[Creation History Blob] Failed to fetch blob: ${response.status}`,
      );
      return null;
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
async function saveToBlob(data: CreationHistoryData): Promise<void> {
  const content = JSON.stringify(data, null, 2);

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
    await put(CREATION_HISTORY_BLOB_NAME, content, {
      contentType: "application/json",
      access: "private",
      allowOverwrite: true,
    });

    console.log(
      `[Creation History Blob] Saved ${data.creations.length} creations`,
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
    const { creations: clientCreations } = req.body || {};

    if (!Array.isArray(clientCreations)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "creations must be an array",
      });
    }

    // Load existing data from blob
    const blobData = await loadFromBlob();

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

    // Save to blob
    const dataToSave: CreationHistoryData = {
      creations: limitedCreations,
      lastSynced: Date.now(),
      version: 1,
    };

    await saveToBlob(dataToSave);

    console.log("[Creation History] Sync successful:", {
      clientCount: clientCreations.length,
      mergedCount: limitedCreations.length,
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
    const data = await loadFromBlob();

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

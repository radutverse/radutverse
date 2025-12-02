import { put, list, getBlob } from "@vercel/blob";
import type { RequestHandler } from "express";

const MAX_BLOB_SIZE = 4 * 1024 * 1024;

const sanitizeBlobKey = (key: string): string => {
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
      console.log(`[Blob] No history for key: ${sanitizedKey}`);
      return null;
    }

    // Use getBlob(), NOT manual fetch
    const { blob } = await getBlob(blobs[0].url);
    const text = await blob.text();
    return JSON.parse(text) as CreationHistoryData;

  } catch (error) {
    console.warn("[Blob] Load error:", error);
    return null;
  }
}

/**
 * Save creation history to Blob
 */
async function saveToBlob(
  data: CreationHistoryData,
  blobKey: string = "creation-history.json",
): Promise<void> {
  let content = JSON.stringify(data, null, 2);
  const sanitizedKey = sanitizeBlobKey(blobKey);

  if (content.length > MAX_BLOB_SIZE) {
    data.creations = data.creations.slice(0, 100);
    content = JSON.stringify(data, null, 2);
    if (content.length > MAX_BLOB_SIZE) {
      throw new Error("Creation history too large to store");
    }
  }

  await put(sanitizedKey, content, {
    contentType: "application/json",
    access: "public",
    allowOverwrite: true,
  });

  console.log(`[Blob] Saved ${data.creations.length} items → ${sanitizedKey}`);
}

/**
 * Sync creation history
 */
export const handleSyncCreationHistory: RequestHandler = async (req, res) => {
  try {
    const { creations: clientCreations, blobKey } = req.body || {};

    if (!Array.isArray(clientCreations)) {
      return res.status(400).json({
        error: "invalid_request",
        message: "creations must be an array",
      });
    }

    const blobData = await loadFromBlob(blobKey);
    const merged = [...clientCreations];

    if (blobData) {
      const clientIds = new Set(clientCreations.map((c: any) => c.id));
      for (const creation of blobData.creations) {
        if (!clientIds.has(creation.id)) merged.push(creation);
      }
    }

    merged.sort((a: any, b: any) => b.timestamp - a.timestamp);
    const limited = merged.slice(0, 500);

    const toSave: CreationHistoryData = {
      creations: limited,
      lastSynced: Date.now(),
      version: 1,
    };

    await saveToBlob(toSave, blobKey);

    return res.status(200).json({
      ok: true,
      synced: limited.length,
      creations: limited,
      lastSynced: toSave.lastSynced,
    });

  } catch (error) {
    console.error("[Sync] Error:", error);
    return res.status(500).json({
      error: "sync_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get creation history
 */
export const handleGetCreationHistory: RequestHandler = async (req, res) => {
  try {
    const { blobKey } = req.body || {};
    const data = await loadFromBlob(blobKey);

    return res.status(200).json({
      ok: true,
      creations: data?.creations ?? [],
      lastSynced: data?.lastSynced ?? null,
    });

  } catch (error) {
    console.error("[Get] Error:", error);
    return res.status(500).json({
      error: "get_failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

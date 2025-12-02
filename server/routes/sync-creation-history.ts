import crypto from "crypto";
import { list, del } from "@vercel/blob";
import { createClient } from "@vercel/blob";
import type { RequestHandler } from "express";

const BLOB_NAME = "creation-history.json.enc";
const MAX_SIZE = 4 * 1024 * 1024;

const AES_KEY = process.env.CREATION_HISTORY_ENCRYPTION_KEY!;
const AES_ALGO = "aes-256-gcm";

---------------------------------------------------------

function encrypt(data: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(AES_ALGO, AES_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(base64: string) {
  const raw = Buffer.from(base64, "base64");

  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = crypto.createDecipheriv(AES_ALGO, AES_KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

---------------------------------------------------------

async function loadFromBlob() {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    if (blobs.length === 0) return null;

    const url = blobs[0].url;
    const etag = blobs[0].etag; // For caching

    const res = await fetch(url);
    if (!res.ok) return null;

    const base64 = await res.text();
    const decrypted = decrypt(base64);

    const json = JSON.parse(decrypted);
    json._etag = etag;

    return json;
  } catch (err) {
    console.error("[Blob] load error:", err);
    return null;
  }
}

---------------------------------------------------------

async function saveToBlob(data: any) {
  const json = JSON.stringify(data, null, 2);

  if (json.length > MAX_SIZE) {
    console.warn("[Blob] too large, trimming to 100 items");
    data.creations = data.creations.slice(0, 100);
  }

  const encrypted = encrypt(JSON.stringify(data));

  const client = createClient();
  const { url, pathname } = await client.generateUploadUrl({
    contentType: "application/octet-stream",
  });

  const upload = await fetch(url, {
    method: "PUT",
    body: encrypted,
  });

  if (!upload.ok) throw new Error("Upload failed");

  // Delete old blob so name stays consistent
  await del(BLOB_NAME);

  // Rename uploaded blob to the fixed name
  await client.rename(pathname, BLOB_NAME);
}

---------------------------------------------------------

export const handleSyncCreationHistory: RequestHandler = async (req, res) => {
  try {
    const clientCreations = req.body?.creations || [];
    if (!Array.isArray(clientCreations))
      return res.status(400).json({ error: "Invalid data" });

    const blobData = await loadFromBlob();
    const serverCreations = blobData?.creations || [];

    const ids = new Set(clientCreations.map((c: any) => c.id));

    const merged = [
      ...clientCreations,
      ...serverCreations.filter((s: any) => !ids.has(s.id)),
    ];

    merged.sort((a: any, b: any) => b.timestamp - a.timestamp);
    const limited = merged.slice(0, 500);

    const dataToSave = {
      creations: limited,
      lastSynced: Date.now(),
      version: 1,
    };

    await saveToBlob(dataToSave);

    res.json({
      ok: true,
      synced: limited.length,
      creations: limited,
      lastSynced: dataToSave.lastSynced,
    });
  } catch (err: any) {
    console.error("[Sync] error:", err);
    res.status(500).json({ error: err.message || "Sync failed" });
  }
};

---------------------------------------------------------

export const handleGetCreationHistory: RequestHandler = async (_req, res) => {
  try {
    const data = await loadFromBlob();
    if (!data)
      return res.json({
        ok: true,
        creations: [],
        lastSynced: null,
      });

    return res.json({
      ok: true,
      creations: data.creations,
      lastSynced: data.lastSynced,
    });
  } catch (err: any) {
    console.error("[Get] error:", err);
    return res.status(500).json({ error: "get_failed" });
  }
};

import { kv } from "@vercel/kv";

/**
 * Whitelist structure using Vercel KV:
 * - "whitelist:entries" → JSON array of hashes
 * - "whitelist:hash:{hash}" → metadata for that hash
 * - "whitelist:timestamp" → last updated timestamp
 */

interface RemixImageMetadata {
  ipId: string;
  title: string;
  timestamp: number;
  pHash?: string;
  visionDescription?: string;
  ownerAddress?: string;
  mediaType?: string;
  score?: number | null;
  description?: string;
  parentIpIds?: string[];
  licenseTermsIds?: string[];
  licenseTemplates?: string[];
  parentIpDetails?: any;
  royaltyContext?: string;
  maxMintingFee?: string;
  maxRts?: string;
  maxRevenueShare?: number;
  licenseVisibility?: string;
  licenses?: any[];
  isDerivative?: boolean;
  parentsCount?: number;
  matchType?: string;
  similarity?: number;
  [key: string]: any;
}

interface RemixHashEntry {
  hash: string;
  metadata: RemixImageMetadata;
}

interface RemixHashWhitelist {
  entries: RemixHashEntry[];
  lastUpdated: number;
}

const ENTRIES_KEY = "whitelist:entries";
const TIMESTAMP_KEY = "whitelist:timestamp";

/**
 * Get all entries from KV
 */
async function getWhitelistEntries(): Promise<string[]> {
  try {
    const entries = await kv.get<string[]>(ENTRIES_KEY);
    return entries || [];
  } catch (error) {
    console.warn("[Remix Hash KV] Error loading entries:", error);
    return [];
  }
}

/**
 * Save entries list to KV
 */
async function saveWhitelistEntries(entries: string[]): Promise<void> {
  try {
    await kv.set(ENTRIES_KEY, entries);
    await kv.set(TIMESTAMP_KEY, Date.now());
  } catch (error) {
    console.error("[Remix Hash KV] Error saving entries:", error);
    throw error;
  }
}

/**
 * Add hash to whitelist with separated metadata
 * @param hash SHA256 hash of pure image pixels only
 * @param metadata Image metadata (ipId, title, etc)
 */
export async function addHashToWhitelist(
  hash: string,
  metadata: RemixImageMetadata,
): Promise<void> {
  try {
    // Check if hash already exists
    const entries = await getWhitelistEntries();
    if (entries.includes(hash)) {
      console.log(`[Remix Hash KV] Hash ${hash} already exists`);
      return;
    }

    // Store metadata with namespaced key
    await kv.set(`whitelist:hash:${hash}`, metadata);

    // Add to entries list
    entries.push(hash);
    await saveWhitelistEntries(entries);

    console.log(
      `[Remix Hash KV] Added hash ${hash} for IP ${metadata.ipId} (${metadata.title})`,
    );
  } catch (error) {
    console.error("[Remix Hash KV] Error adding hash:", error);
    throw error;
  }
}

/**
 * Check if hash exists in whitelist
 * Returns the metadata if found, null otherwise
 */
export async function checkHashInWhitelist(
  hash: string,
): Promise<RemixImageMetadata | null> {
  try {
    const metadata = await kv.get<RemixImageMetadata>(`whitelist:hash:${hash}`);
    return metadata || null;
  } catch (error) {
    console.warn("[Remix Hash KV] Error checking hash:", error);
    return null;
  }
}

/**
 * Get all hashes in whitelist
 */
export async function getAllWhitelistHashes(): Promise<string[]> {
  try {
    return await getWhitelistEntries();
  } catch (error) {
    console.warn("[Remix Hash KV] Error getting all hashes:", error);
    return [];
  }
}

/**
 * Get all entries with metadata
 */
export async function getAllWhitelistEntries(): Promise<RemixHashEntry[]> {
  try {
    const hashes = await getWhitelistEntries();
    const entries: RemixHashEntry[] = [];

    for (const hash of hashes) {
      const metadata = await kv.get<RemixImageMetadata>(
        `whitelist:hash:${hash}`,
      );
      if (metadata) {
        entries.push({ hash, metadata });
      }
    }

    return entries;
  } catch (error) {
    console.warn("[Remix Hash KV] Error getting all entries:", error);
    return [];
  }
}

/**
 * Clear whitelist (admin function)
 */
export async function clearWhitelist(): Promise<void> {
  try {
    const hashes = await getWhitelistEntries();

    // Delete all metadata keys
    for (const hash of hashes) {
      await kv.del(`whitelist:hash:${hash}`);
    }

    // Clear entries list
    await kv.del(ENTRIES_KEY);
    await kv.del(TIMESTAMP_KEY);

    console.log("[Remix Hash KV] Whitelist cleared");
  } catch (error) {
    console.error("[Remix Hash KV] Error clearing whitelist:", error);
    throw error;
  }
}

/**
 * Update metadata for a hash (add visionDescription, etc)
 */
export async function updateHashMetadata(
  hash: string,
  partialMetadata: Partial<RemixImageMetadata>,
): Promise<void> {
  try {
    const existing = await kv.get<RemixImageMetadata>(`whitelist:hash:${hash}`);

    if (existing) {
      const updated = { ...existing, ...partialMetadata };
      await kv.set(`whitelist:hash:${hash}`, updated);
      await kv.set(TIMESTAMP_KEY, Date.now());
      console.log(`[Remix Hash KV] Updated metadata for hash ${hash}`);
    }
  } catch (error) {
    console.error("[Remix Hash KV] Error updating metadata:", error);
    throw error;
  }
}

/**
 * Delete hash from whitelist
 */
export async function deleteHashFromWhitelist(hash: string): Promise<void> {
  try {
    const entries = await getWhitelistEntries();
    const filtered = entries.filter((h) => h !== hash);

    if (filtered.length < entries.length) {
      await kv.del(`whitelist:hash:${hash}`);
      await saveWhitelistEntries(filtered);
      console.log(`[Remix Hash KV] Deleted hash ${hash} from whitelist`);
    }
  } catch (error) {
    console.error("[Remix Hash KV] Error deleting hash:", error);
    throw error;
  }
}

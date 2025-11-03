import { put, get } from "@vercel/blob";

/**
 * Refactored Whitelist Structure:
 * - Hash: SHA256 of pure image pixels only (no metadata)
 * - Metadata: Stored separately (ipId, title, timestamp, pHash, visionDescription)
 *
 * This separation allows:
 * 1. Pure image hash matching
 * 2. Flexible metadata storage
 * 3. Multiple metadata per hash (if needed)
 * 4. Clean hash-based comparison
 */

interface RemixImageMetadata {
  ipId: string;
  title: string;
  timestamp: number;
  pHash?: string;
  visionDescription?: string;
  // Asset Details
  ownerAddress?: string;
  mediaType?: string;
  score?: number | null;
  description?: string;
  // Parent IP Details
  parentIpIds?: string[];
  licenseTermsIds?: string[];
  licenseTemplates?: string[];
  parentIpDetails?: any; // Full parent IP details from Details modal
  // License Configuration
  royaltyContext?: string;
  maxMintingFee?: string; // Wei format
  maxRts?: string; // Wei format
  maxRevenueShare?: number; // 0-100
  licenseVisibility?: string;
  // Detailed Licenses
  licenses?: any[]; // Full license terms array
  // Derivative Status
  isDerivative?: boolean;
  parentsCount?: number;
  // Match tracking
  matchType?: string;
  similarity?: number;
  // Allow any additional fields
  [key: string]: any;
}

interface RemixHashEntry {
  hash: string; // SHA256 of pure image pixels only
  metadata: RemixImageMetadata;
}

interface RemixHashWhitelist {
  entries: RemixHashEntry[];
  lastUpdated: number;
}

const BLOB_NAME = "remix-hashes.json";

/**
 * Load whitelist from Vercel Blob
 */
async function loadWhitelist(): Promise<RemixHashWhitelist> {
  try {
    const blob = await get(BLOB_NAME);
    if (!blob) {
      return { entries: [], lastUpdated: Date.now() };
    }

    const content = await blob.text();
    const parsed = JSON.parse(content);

    // Support both old and new formats
    if (parsed.entries && parsed.entries.length > 0) {
      if (parsed.entries[0].metadata) {
        // New format: already separated
        return parsed;
      } else if (parsed.entries[0].ipId) {
        // Old format: needs migration
        console.log("[Remix Hash] Migrating whitelist to new format...");
        const migratedEntries = parsed.entries.map((entry: any) => ({
          hash: entry.hash,
          metadata: {
            ipId: entry.ipId,
            title: entry.title,
            timestamp: entry.timestamp,
            pHash: entry.pHash,
            visionDescription: entry.visionDescription,
          },
        }));

        return {
          entries: migratedEntries,
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }
    }

    return parsed;
  } catch (error) {
    // Blob doesn't exist or error reading, return empty whitelist
    console.log("[Remix Hash] Starting with empty whitelist from Vercel Blob");
    return { entries: [], lastUpdated: Date.now() };
  }
}

/**
 * Save whitelist to Vercel Blob
 */
async function saveWhitelist(whitelist: RemixHashWhitelist): Promise<void> {
  whitelist.lastUpdated = Date.now();
  const content = JSON.stringify(whitelist, null, 2);

  try {
    await put(BLOB_NAME, content, {
      contentType: "application/json",
      access: "public",
    });
  } catch (error) {
    console.error(
      "[Remix Hash] Failed to save whitelist to Vercel Blob:",
      error,
    );
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
  const whitelist = await loadWhitelist();

  // Check if hash already exists
  const exists = whitelist.entries.some((entry) => entry.hash === hash);

  if (!exists) {
    whitelist.entries.push({
      hash,
      metadata,
    });

    await saveWhitelist(whitelist);
    console.log(
      `[Remix Hash] Added hash ${hash} for IP ${metadata.ipId} (${metadata.title})`,
    );
  }
}

/**
 * Check if hash exists in whitelist
 * Returns the metadata if found, null otherwise
 */
export async function checkHashInWhitelist(
  hash: string,
): Promise<RemixImageMetadata | null> {
  const whitelist = await loadWhitelist();
  const entry = whitelist.entries.find((entry) => entry.hash === hash);
  return entry?.metadata || null;
}

/**
 * Get all hashes in whitelist
 */
export async function getAllWhitelistHashes(): Promise<string[]> {
  const whitelist = await loadWhitelist();
  return whitelist.entries.map((entry) => entry.hash);
}

/**
 * Get all entries with metadata
 */
export async function getAllWhitelistEntries(): Promise<RemixHashEntry[]> {
  const whitelist = await loadWhitelist();
  return whitelist.entries;
}

/**
 * Clear whitelist (admin function)
 */
export async function clearWhitelist(): Promise<void> {
  const whitelist: RemixHashWhitelist = {
    entries: [],
    lastUpdated: Date.now(),
  };
  await saveWhitelist(whitelist);
  console.log("[Remix Hash] Whitelist cleared");
}

/**
 * Update metadata for a hash (add visionDescription, etc)
 */
export async function updateHashMetadata(
  hash: string,
  partialMetadata: Partial<RemixImageMetadata>,
): Promise<void> {
  const whitelist = await loadWhitelist();
  const entry = whitelist.entries.find((e) => e.hash === hash);

  if (entry) {
    entry.metadata = { ...entry.metadata, ...partialMetadata };
    await saveWhitelist(whitelist);
    console.log(`[Remix Hash] Updated metadata for hash ${hash}`);
  }
}

/**
 * Delete hash from whitelist
 */
export async function deleteHashFromWhitelist(hash: string): Promise<void> {
  const whitelist = await loadWhitelist();
  const initialLength = whitelist.entries.length;
  whitelist.entries = whitelist.entries.filter((entry) => entry.hash !== hash);

  if (whitelist.entries.length < initialLength) {
    await saveWhitelist(whitelist);
    console.log(`[Remix Hash] Deleted hash ${hash} from whitelist`);
  }
}


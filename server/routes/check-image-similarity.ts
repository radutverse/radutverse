import type { Request, Response } from "express";
import sharp from "sharp";
import { checkHashInWhitelist } from "../utils/remix-hash-whitelist.js";

let whitelistCache: any = null;
let whitelistCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Calculate Hamming distance between two perceptual hashes (optimized)
 */
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 64;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    distance +=
      (xor & 0x1) +
      ((xor >> 1) & 0x1) +
      ((xor >> 2) & 0x1) +
      ((xor >> 3) & 0x1);
  }
  return distance;
}

/**
 * Calculate similarity percentage from hamming distance
 */
function calculateSimilarityPercent(distance: number): number {
  const similarity = Math.max(0, (64 - distance) / 64) * 100;
  return Math.round(similarity * 10) / 10;
}

/**
 * Calculate perceptual hash from image buffer (optimized with single pipeline)
 */
async function calculateImagePerceptualHash(
  imageBuffer: Buffer,
): Promise<string | null> {
  try {
    const size = 32;
    const resized = await sharp(imageBuffer)
      .resize(size, size, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = resized.data;
    const pixelCount = data.length;

    let sum = 0;
    for (let i = 0; i < pixelCount; i++) {
      sum += data[i];
    }
    const avg = sum / pixelCount;

    let hash = "";
    for (let i = 0; i < 64; i++) {
      const regionStart = (i >> 3) * 4 * size + (i & 7) * 4;
      let regionSum = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const pos = regionStart + y * size + x;
          if (pos < pixelCount) {
            regionSum += data[pos];
          }
        }
      }
      hash += regionSum > avg * 16 ? "1" : "0";
    }

    const hashHex =
      parseInt(hash.substring(0, 32), 2).toString(16).padStart(8, "0") +
      parseInt(hash.substring(32, 64), 2).toString(16).padStart(8, "0");

    return hashHex;
  } catch (error) {
    console.error("Error calculating perceptual hash:", error);
    return null;
  }
}

/**
 * Load whitelist with caching
 */
async function loadWhitelistCached() {
  const now = Date.now();
  if (whitelistCache && now - whitelistCacheTime < CACHE_DURATION) {
    return whitelistCache;
  }

  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const whitelistPath = path.join(
      process.cwd(),
      "server",
      "data",
      "remix-hashes.json",
    );
    const content = await fs.readFile(whitelistPath, "utf-8");
    whitelistCache = JSON.parse(content);
    whitelistCacheTime = now;
    return whitelistCache;
  } catch (error) {
    console.warn("Could not load whitelist:", error);
    return { entries: [] };
  }
}

/**
 * Check if image is similar to any whitelisted images
 * POST /api/check-image-similarity
 * Optimized for performance with early exit and caching
 */
export const handleCheckImageSimilarity: any = async (
  req: any,
  res: any,
): Promise<void> => {
  try {
    let imageBuffer: Buffer | null = null;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body && Buffer.isBuffer(req.body)) {
      imageBuffer = req.body;
    } else if (typeof req.body === "string") {
      imageBuffer = Buffer.from(req.body, "base64");
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({
        found: false,
        similarity: 0,
        message: "No image data provided",
      });
    }

    const uploadedPHash = await calculateImagePerceptualHash(imageBuffer);
    if (!uploadedPHash) {
      return res.status(400).json({
        found: false,
        similarity: 0,
        message: "Failed to process image",
      });
    }

    const threshold = 75;
    const whitelist = await loadWhitelistCached();
    const results: Array<{
      ipId: string;
      title: string;
      similarity: number;
      distance: number;
    }> = [];

    for (const entry of whitelist.entries || []) {
      if (entry.pHash) {
        const distance = hammingDistance(uploadedPHash, entry.pHash);
        const similarity = calculateSimilarityPercent(distance);

        if (similarity >= threshold) {
          return res.status(200).json({
            found: true,
            similarity,
            distance,
            ipId: entry.ipId,
            title: entry.title,
            message: `Image mirip dengan IP "${entry.title}" (${similarity}% match). Tidak dapat registrasi.`,
          });
        }

        if (similarity > 50) {
          results.push({
            ipId: entry.ipId,
            title: entry.title,
            similarity,
            distance,
          });
        }
      }
    }

    res.status(200).json({
      found: false,
      similarity: 0,
      message: "No similar images found",
      topMatches: results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3),
    });
  } catch (error) {
    console.error("Error checking image similarity:", error);
    res.status(500).json({
      found: false,
      similarity: 0,
      message: "Error checking image similarity",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

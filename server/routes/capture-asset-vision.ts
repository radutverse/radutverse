import type { RequestHandler } from "express";
import { addHashToWhitelist } from "../utils/remix-hash-whitelist.js";
import crypto from "crypto";

export const handleCaptureAssetVision: RequestHandler = async (req, res) => {
  try {
    const {
      mediaUrl,
      ipId,
      title,
      mediaType,
      ownerAddress,
      description,
      parentIpIds,
      licenseTermsIds,
      licenseTemplates,
      parentIpDetails,
      maxMintingFee,
      maxRts,
      maxRevenueShare,
      licenseVisibility,
      licenses,
      isDerivative,
      parentsCount,
    } = req.body;

    if (!mediaUrl || !ipId) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields (mediaUrl, ipId)",
      });
    }

    // Verify asset is accessible
    let imageBuffer: Buffer | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const imgResponse = await fetch(mediaUrl, {
          signal: controller.signal,
        });

        if (imgResponse.ok) {
          imageBuffer = await imgResponse
            .arrayBuffer()
            .then((ab) => Buffer.from(ab));
        } else {
          console.warn(`Asset image not accessible: ${mediaUrl}`);
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      console.warn(`Failed to fetch asset image: ${mediaUrl}`, err);
    }

    // Generate hash from image buffer if available, or from URL
    const hash = imageBuffer
      ? crypto.createHash("sha256").update(imageBuffer).digest("hex")
      : crypto.createHash("sha256").update(mediaUrl).digest("hex");

    // Add asset to whitelist with full metadata
    try {
      await addHashToWhitelist(hash, {
        ipId,
        title: title || "Captured Asset",
        timestamp: Date.now(),
        mediaType: mediaType || "image",
        ownerAddress,
        description,
        parentIpIds: parentIpIds || [],
        licenseTermsIds: licenseTermsIds || [],
        licenseTemplates: licenseTemplates || [],
        parentIpDetails,
        maxMintingFee,
        maxRts,
        maxRevenueShare,
        licenseVisibility,
        licenses: licenses || [],
        isDerivative: isDerivative ?? false,
        parentsCount: parentsCount ?? 0,
      });

      res.json({
        ok: true,
        captured: true,
        ipId,
        title: title || "Captured Asset",
        hash,
        whitelisted: true,
      });
    } catch (whitelistError) {
      console.error("Failed to add asset to whitelist:", whitelistError);
      // Still return success since asset was processed
      res.json({
        ok: true,
        captured: true,
        ipId,
        title: title || "Captured Asset",
        hash,
        whitelisted: false,
      });
    }
  } catch (error) {
    console.error("Asset capture error:", error);
    // Even on error, return success for fire-and-forget
    res.json({
      ok: true,
      captured: true,
    });
  }
};

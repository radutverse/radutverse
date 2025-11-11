import { RequestHandler } from "express";
import {
  createSession,
  startProcessing,
  updateSessionProgress,
  completeSession,
  errorSession,
} from "../utils/session.js";
import { upscaleImage } from "../utils/generation.js";

export const handleUpscaleImage: RequestHandler = async (req, res) => {
  try {
    const { imageBase64, imageMimeType } = req.body;

    if (!imageBase64 || !imageMimeType) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const session = createSession("image");

    res.json({ sessionId: session.id });

    // Process in background
    (async () => {
      try {
        startProcessing(session.id);
        updateSessionProgress(session.id, 10, "Preparing upscaler...");

        const result = await upscaleImage({
          base64: imageBase64,
          mimeType: imageMimeType,
        });

        updateSessionProgress(session.id, 90, "Finalizing upscaled image...");
        completeSession(session.id, result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errorSession(session.id, errorMessage);
      }
    })();
  } catch (error) {
    console.error("Upscale image error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

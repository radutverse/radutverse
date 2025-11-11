import { RequestHandler } from "express";
import {
  createSession,
  startProcessing,
  updateSessionProgress,
  completeSession,
  errorSession,
} from "../utils/session.js";
import { generateVideoFromImageAndText } from "../utils/generation.js";

export const handleGenerateVideoFromImage: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { prompt, imageBase64, imageMimeType } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    if (!imageBase64 || !imageMimeType) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const session = createSession("video");

    res.json({ sessionId: session.id });

    // Process in background
    (async () => {
      try {
        startProcessing(session.id);
        updateSessionProgress(
          session.id,
          5,
          "Processing image for video generation...",
        );

        const result = await generateVideoFromImageAndText(
          prompt,
          {
            base64: imageBase64,
            mimeType: imageMimeType,
          },
          (message, progress) => {
            updateSessionProgress(session.id, progress, message);
          },
        );

        completeSession(session.id, result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errorSession(session.id, errorMessage);
      }
    })();
  } catch (error) {
    console.error("Generate video from image error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

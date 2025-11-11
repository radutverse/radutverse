import { RequestHandler } from "express";
import {
  createSession,
  startProcessing,
  updateSessionProgress,
  completeSession,
  errorSession,
} from "../utils/session.js";
import { generateImageFromText } from "../utils/generation.js";

export const handleGenerateImage: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    const session = createSession("image");

    res.json({ sessionId: session.id });

    // Process in background
    (async () => {
      try {
        startProcessing(session.id);
        updateSessionProgress(session.id, 10, "Preparing image generation...");

        const result = await generateImageFromText(prompt);

        updateSessionProgress(session.id, 90, "Finalizing image...");
        completeSession(session.id, result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errorSession(session.id, errorMessage);
      }
    })();
  } catch (error) {
    console.error("Generate image error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

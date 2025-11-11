import { RequestHandler } from "express";
import {
  createSession,
  startProcessing,
  updateSessionProgress,
  completeSession,
  errorSession,
} from "../utils/session.js";
import { generateVideoFromText } from "../utils/generation.js";

export const handleGenerateVideo: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
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
          "Warming up the creative engines...",
        );

        const result = await generateVideoFromText(
          prompt,
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
    console.error("Generate video error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

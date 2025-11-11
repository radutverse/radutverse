import { RequestHandler } from "express";
import { getSession } from "../utils/session.js";

export const handleGetGenerationProgress: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Missing or invalid sessionId" });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      id: session.id,
      status: session.status,
      progress: session.progress,
      progressMessage: session.progressMessage,
      result: session.result,
      error: session.error,
    });
  } catch (error) {
    console.error("Get generation progress error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

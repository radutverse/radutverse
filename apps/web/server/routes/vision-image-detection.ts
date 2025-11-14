import { RequestHandler } from "express";

export const handleVisionImageDetection: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

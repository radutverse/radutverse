import { RequestHandler } from "express";

export const handleAnalyzeImageVision: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

import { RequestHandler } from "express";

export const handleCheckImageSimilarity: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

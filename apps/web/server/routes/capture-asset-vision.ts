import { RequestHandler } from "express";

export const handleCaptureAssetVision: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

import { RequestHandler } from "express";

export const handleUpload: RequestHandler = (req, res) => {
  res.json({ ok: true, message: "Upload endpoint" });
};

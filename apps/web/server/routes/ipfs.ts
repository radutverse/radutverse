import { RequestHandler } from "express";

export const handleIpfsUpload: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

export const handleIpfsUploadJson: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

import { RequestHandler } from "express";

export const handleCheckIpAssets: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

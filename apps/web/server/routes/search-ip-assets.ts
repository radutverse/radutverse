import { RequestHandler } from "express";

export const handleSearchIpAssets: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

import { RequestHandler } from "express";

export const handleResolveIpName: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

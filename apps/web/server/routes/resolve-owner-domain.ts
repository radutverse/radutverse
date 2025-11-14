import { RequestHandler } from "express";

export const handleResolveOwnerDomain: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

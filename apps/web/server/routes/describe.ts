import { RequestHandler } from "express";

export const handleDescribe: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

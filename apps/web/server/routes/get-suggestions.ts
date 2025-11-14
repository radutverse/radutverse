import { RequestHandler } from "express";

export const handleGetSuggestions: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

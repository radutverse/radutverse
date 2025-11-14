import { RequestHandler } from "express";

export const handleParseSearchIntent: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

import { RequestHandler } from "express";

export const handleSearchByOwner: RequestHandler = (req, res) => {
  res.json({ ok: true });
};

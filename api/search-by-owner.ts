import { setCorsHeaders, handleOptions } from "./utils/middleware";
import { handleSearchByOwner } from "../server/routes/search-by-owner.js";

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "POST") {
    return await handleSearchByOwner(req as any, res as any);
  }

  res.status(405).json({ error: "Method not allowed" });
}

import { setCorsHeaders, handleOptions } from "../utils/middleware";
import { handleClearRemixHashes } from "../../server/routes/remix-hash-whitelist.js";

export default async function handler(
  req: any,
  res: any,
) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "POST") {
    return await handleClearRemixHashes(req as any, res as any);
  }

  res.status(405).json({ error: "Method not allowed" });
}

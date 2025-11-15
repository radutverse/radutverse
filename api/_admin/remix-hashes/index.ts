import { setCorsHeaders, handleOptions } from "../../utils/middleware";
import { handleGetRemixHashes } from "../../../server/routes/remix-hash-whitelist.js";

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "GET") {
    return await handleGetRemixHashes(req as any, res as any);
  }

  res.status(405).json({ error: "Method not allowed" });
}

import { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, handleOptions } from "./utils/middleware";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "GET") {
    const ping = process.env.PING_MESSAGE ?? "ping";
    return res.json({ message: ping });
  }

  res.status(405).json({ error: "Method not allowed" });
}

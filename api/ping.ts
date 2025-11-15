import { setCorsHeaders, handleOptions } from "./utils/middleware";

export default async function handler(req: any, res: any) {
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

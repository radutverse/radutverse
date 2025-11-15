import { setCorsHeaders, handleOptions } from "./utils/middleware";

export default async function handler(
  req: any,
  res: any,
) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "GET") {
    return res.json({ ok: true, hasKey: !!process.env.OPENAI_API_KEY });
  }

  res.status(405).json({ error: "Method not allowed" });
}

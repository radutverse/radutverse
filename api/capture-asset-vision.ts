import { VercelRequest, VercelResponse } from "@vercel/node";
import { setCorsHeaders, handleOptions } from "./utils/middleware";
import { handleCaptureAssetVision } from "../server/routes/capture-asset-vision.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "POST") {
    return await handleCaptureAssetVision(req as any, res as any);
  }

  res.status(405).json({ error: "Method not allowed" });
}

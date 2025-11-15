import multer from "multer";
import { setCorsHeaders, handleOptions } from "./utils/middleware";
import { demoEditImage } from "../server/routes/demo-generate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const uploadMiddleware = upload.single("image");

export default async function handler(
  req: any,
  res: any,
) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "POST") {
    return new Promise<void>((resolve) => {
      uploadMiddleware(req as any, res as any, async (err: any) => {
        if (err) {
          res.status(400).json({ error: err.message });
          resolve();
          return;
        }
        await demoEditImage(req as any, res as any);
        resolve();
      });
    });
  }

  res.status(405).json({ error: "Method not allowed" });
}

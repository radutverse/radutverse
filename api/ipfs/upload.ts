import { setCorsHeaders, handleOptions } from "../utils/middleware";
import { handleIpfsUpload } from "../../server/routes/ipfs.js";

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "POST") {
    const handlers = Array.isArray(handleIpfsUpload)
      ? handleIpfsUpload
      : [handleIpfsUpload];

    if (handlers.length === 0) {
      return await handleIpfsUpload(req as any, res as any);
    }

    let currentHandler = 0;
    const executeNext = async () => {
      if (currentHandler < handlers.length) {
        const handler = handlers[currentHandler++];
        await new Promise<void>((resolve) => {
          handler(req as any, res as any, () => {
            if (currentHandler < handlers.length) {
              executeNext().then(resolve);
            } else {
              resolve();
            }
          });
        });
      }
    };

    await executeNext();
  }

  res.status(405).json({ error: "Method not allowed" });
}

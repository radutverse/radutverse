import { createServer } from "../server/index";

const app = createServer();

export default function handler(req: any, res: any) {
  // Pass the request directly to Express. This works with Vercel Node functions.
  return app(req, res);
}

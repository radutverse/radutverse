import serverless from "serverless-http";

import { createServer } from "../../server/index.js";

let handler: any;

(async () => {
  const app = await createServer();
  handler = serverless(app);
})();

export { handler };

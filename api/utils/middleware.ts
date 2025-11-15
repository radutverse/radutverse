import { VercelRequest, VercelResponse } from "@vercel/node";

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || req.headers.referer;

  const allowedOrigins = [
    "localhost",
    "127.0.0.1",
    ".vercel.app",
    ".netlify.app",
  ];

  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else {
    isAllowed = allowedOrigins.some((allowedOrigin) =>
      origin.includes(allowedOrigin),
    );
  }

  if (!isAllowed && process.env.APP_ORIGIN) {
    isAllowed = origin?.includes(process.env.APP_ORIGIN) || false;
  }

  if (process.env.NODE_ENV === "production") {
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Idempotency-Key, Authorization",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
}

export function handleOptions(res: VercelResponse) {
  res.status(200).end();
}

export function handleCorsError(
  error: any,
  origin: string | undefined,
  res: VercelResponse,
) {
  if (process.env.NODE_ENV === "production") {
    console.warn(`CORS request from unauthorized origin: ${origin}`);
    res.status(403).json({ error: "CORS not allowed" });
  } else {
    console.warn(`[CORS] Request from ${origin} (allowed in dev mode)`);
  }
}

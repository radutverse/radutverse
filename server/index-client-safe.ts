// This file is used ONLY during client build to avoid loading sharp
// The real server/index.ts is used for actual API runtime

import express from "express";
import cors from "cors";

export function createServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Dummy endpoint for build
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
  });
  
  return app;
}

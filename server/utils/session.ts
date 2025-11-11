import { randomUUID } from "crypto";

export interface GenerationSession {
  id: string;
  type: "image" | "video";
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  progressMessage: string;
  result?: string | null;
  error?: string | null;
  createdAt: number;
  expiresAt: number;
}

// In-memory session store (for demo; in production use Redis)
const sessions = new Map<string, GenerationSession>();

// Cleanup expired sessions every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
  }
}, 30000);

export function createSession(type: "image" | "video"): GenerationSession {
  const id = randomUUID();
  const session: GenerationSession = {
    id,
    type,
    status: "pending",
    progress: 0,
    progressMessage: "Initializing...",
    result: null,
    error: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): GenerationSession | undefined {
  return sessions.get(id);
}

export function updateSessionProgress(
  id: string,
  progress: number,
  progressMessage: string,
): void {
  const session = sessions.get(id);
  if (session) {
    session.progress = progress;
    session.progressMessage = progressMessage;
    session.expiresAt = Date.now() + 10 * 60 * 1000; // Extend expiry
  }
}

export function completeSession(id: string, result: string): void {
  const session = sessions.get(id);
  if (session) {
    session.status = "completed";
    session.progress = 100;
    session.result = result;
    session.expiresAt = Date.now() + 10 * 60 * 1000; // Extend expiry
  }
}

export function errorSession(id: string, error: string): void {
  const session = sessions.get(id);
  if (session) {
    session.status = "error";
    session.error = error;
    session.expiresAt = Date.now() + 10 * 60 * 1000; // Extend expiry
  }
}

export function startProcessing(id: string): void {
  const session = sessions.get(id);
  if (session) {
    session.status = "processing";
  }
}

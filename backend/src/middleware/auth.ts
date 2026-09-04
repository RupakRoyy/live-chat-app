import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req);

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.clerkSecretKey,
      authorizedParties: [env.frontendUrl],
    });

    if (!payload.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.auth = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

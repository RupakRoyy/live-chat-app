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

export async function verifyClerkIdentity(
  token: string,
): Promise<{ userId: string } | null> {
  const payload = await verifyToken(token, {
    secretKey: env.clerkSecretKey,
    authorizedParties: [env.frontendUrl],
  });

  if (!payload.sub) {
    return null;
  }

  return { userId: payload.sub };
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
    const identity = await verifyClerkIdentity(token);
    if (!identity) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.auth = { userId: identity.userId };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Authenticate when a Clerk token is present.
 * Missing token = anonymous. Invalid token remains 401.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const identity = await verifyClerkIdentity(token);
    if (!identity) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.auth = { userId: identity.userId };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

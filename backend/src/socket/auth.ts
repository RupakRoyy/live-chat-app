import type { Socket } from "socket.io";
import { verifyClerkIdentity } from "../middleware/auth.js";

export function getSocketUserId(socket: Socket): string | undefined {
  const userId = socket.data?.userId;
  return typeof userId === "string" && userId.length > 0 ? userId : undefined;
}

function readHandshakeToken(socket: Socket): string | null {
  const raw = socket.handshake.auth?.token;
  if (typeof raw !== "string") {
    return null;
  }

  const token = raw.trim();
  return token || null;
}

/**
 * Attach a verified Clerk user id when a valid token is present.
 * Anonymous sockets remain allowed. Invalid tokens are treated as anonymous
 * so Random Chat/Call/Video stay usable without authentication.
 */
export async function attachSocketIdentity(
  socket: Socket,
  next: (error?: Error) => void,
): Promise<void> {
  const token = readHandshakeToken(socket);
  if (!token) {
    socket.data.userId = undefined;
    next();
    return;
  }

  try {
    const identity = await verifyClerkIdentity(token);
    socket.data.userId = identity?.userId;
    next();
  } catch {
    socket.data.userId = undefined;
    next();
  }
}

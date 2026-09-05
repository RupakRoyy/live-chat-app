import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { matchmakingService } from "../matchmaking/service.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../socket/events.js";
import {
  isMessagingMode,
  parseSendPayload,
  type MessageReceivedPayload,
} from "./types.js";

type MessagingServer = Server<ClientToServerEvents, ServerToClientEvents>;
type MessagingSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

async function resolveActiveMessagingMatch(
  socketId: string,
  claimedMatchId: string,
): Promise<{ matchId: string; peerSocketId: string } | null> {
  const match = await matchmakingService.getMatch(socketId);
  if (!match || match.matchId !== claimedMatchId) {
    return null;
  }

  if (!isMessagingMode(match.mode)) {
    return null;
  }

  const peerMatch = await matchmakingService.getMatch(match.peerSocketId);
  if (!peerMatch || peerMatch.matchId !== match.matchId) {
    return null;
  }

  return {
    matchId: match.matchId,
    peerSocketId: match.peerSocketId,
  };
}

export function registerMessagingHandlers(
  io: MessagingServer,
  socket: MessagingSocket,
): void {
  socket.on("message:send", async (raw) => {
    const payload = parseSendPayload(raw);
    if (!payload) {
      return;
    }

    try {
      const match = await resolveActiveMessagingMatch(
        socket.id,
        payload.matchId,
      );
      if (!match) {
        return;
      }

      const message: MessageReceivedPayload = {
        messageId: randomUUID(),
        matchId: match.matchId,
        senderSocketId: socket.id,
        text: payload.text,
        timestamp: Date.now(),
      };

      io.to(match.peerSocketId).emit("message:received", message);
      socket.emit("message:received", message);
      console.log(`message:send ${socket.id} -> ${match.peerSocketId}`);
    } catch (error) {
      console.error(`message:send failed for ${socket.id}:`, error);
    }
  });
}

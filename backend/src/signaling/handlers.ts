import type { Server, Socket } from "socket.io";
import { matchmakingService } from "../matchmaking/service.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../socket/events.js";
import {
  parseAnswerPayload,
  parseIceCandidatePayload,
  parseOfferPayload,
} from "./types.js";

type SignalingServer = Server<ClientToServerEvents, ServerToClientEvents>;
type SignalingSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

async function resolveMatchedPeer(
  socketId: string,
  claimedPeerId: string,
): Promise<string | null> {
  const match = await matchmakingService.getMatch(socketId);
  if (!match) {
    return null;
  }

  if (match.peerSocketId !== claimedPeerId) {
    console.warn(
      `Signaling rejected: ${socketId} targeted ${claimedPeerId}, matched with ${match.peerSocketId}`,
    );
    return null;
  }

  return match.peerSocketId;
}

export function registerSignalingHandlers(
  io: SignalingServer,
  socket: SignalingSocket,
): void {
  socket.on("webrtc:offer", async (raw) => {
    const payload = parseOfferPayload(raw);
    if (!payload) {
      return;
    }

    try {
      const peerSocketId = await resolveMatchedPeer(socket.id, payload.to);
      if (!peerSocketId) {
        return;
      }

      io.to(peerSocketId).emit("webrtc:offer", {
        from: socket.id,
        description: payload.description,
      });
      console.log(`webrtc:offer ${socket.id} -> ${peerSocketId}`);
    } catch (error) {
      console.error(`webrtc:offer failed for ${socket.id}:`, error);
    }
  });

  socket.on("webrtc:answer", async (raw) => {
    const payload = parseAnswerPayload(raw);
    if (!payload) {
      return;
    }

    try {
      const peerSocketId = await resolveMatchedPeer(socket.id, payload.to);
      if (!peerSocketId) {
        return;
      }

      io.to(peerSocketId).emit("webrtc:answer", {
        from: socket.id,
        description: payload.description,
      });
      console.log(`webrtc:answer ${socket.id} -> ${peerSocketId}`);
    } catch (error) {
      console.error(`webrtc:answer failed for ${socket.id}:`, error);
    }
  });

  socket.on("webrtc:ice-candidate", async (raw) => {
    const payload = parseIceCandidatePayload(raw);
    if (!payload) {
      return;
    }

    try {
      const peerSocketId = await resolveMatchedPeer(socket.id, payload.to);
      if (!peerSocketId) {
        return;
      }

      io.to(peerSocketId).emit("webrtc:ice-candidate", {
        from: socket.id,
        candidate: payload.candidate,
      });
    } catch (error) {
      console.error(`webrtc:ice-candidate failed for ${socket.id}:`, error);
    }
  });
}

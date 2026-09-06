import type { Server, Socket } from "socket.io";
import { resolveMatchmakingJoin } from "../entitlements/index.js";
import { getSocketUserId } from "../socket/auth.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../socket/events.js";
import { matchmakingService } from "./service.js";
import {
  isGenderPreference,
  parseJoinPayload,
  toMatchFoundPayload,
  type ChatMode,
  type GenderPreference,
  type MatchPair,
  type UserGender,
} from "./types.js";

type ResolvedJoin = {
  mode: ChatMode;
  preference: GenderPreference;
  gender?: UserGender;
  userId?: string;
};

type MatchmakingServer = Server<ClientToServerEvents, ServerToClientEvents>;
type MatchmakingSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function emitMatchFound(io: MatchmakingServer, match: MatchPair): void {
  const [a, b] = match.users;

  io.to(a.socketId).emit(
    "match_found",
    toMatchFoundPayload({
      matchId: match.matchId,
      mode: match.mode,
      peerSocketId: b.socketId,
    }),
  );

  io.to(b.socketId).emit(
    "match_found",
    toMatchFoundPayload({
      matchId: match.matchId,
      mode: match.mode,
      peerSocketId: a.socketId,
    }),
  );
}

function isSocketConnected(io: MatchmakingServer, socketId: string): boolean {
  return Boolean(io.sockets.sockets.get(socketId)?.connected);
}

async function cleanupDisconnectedJoiner(
  io: MatchmakingServer,
  socketId: string,
): Promise<void> {
  const match = await matchmakingService.getMatch(socketId);
  await matchmakingService.handleDisconnect(socketId);

  if (match) {
    io.to(match.peerSocketId).emit("webrtc:peer-left", {
      peerSocketId: socketId,
    });
  }
}

async function joinForConnectedSocket(
  io: MatchmakingServer,
  socket: MatchmakingSocket,
  join: ResolvedJoin,
) {
  if (!socket.connected) {
    await cleanupDisconnectedJoiner(io, socket.id);
    return null;
  }

  const result = await matchmakingService.joinQueue(
    {
      socketId: socket.id,
      mode: join.mode,
      preference: join.preference,
      gender: join.gender,
      userId: join.userId,
    },
    {
      isAlive: (socketId) => isSocketConnected(io, socketId),
    },
  );

  if (!socket.connected) {
    await cleanupDisconnectedJoiner(io, socket.id);
    return null;
  }

  const peerSocketId =
    result.status === "matched"
      ? result.match.users.find((user) => user.socketId !== socket.id)?.socketId
      : result.status === "already_matched"
        ? result.match.peerSocketId
        : null;

  if (peerSocketId && !isSocketConnected(io, peerSocketId)) {
    await matchmakingService.handleDisconnect(peerSocketId);
    await matchmakingService.handleDisconnect(socket.id);
    return joinForConnectedSocket(io, socket, join);
  }

  return result;
}

export function registerMatchmakingHandlers(
  io: MatchmakingServer,
  socket: MatchmakingSocket,
): void {
  socket.on("matchmaking:join", async (payload) => {
    const parsed = parseJoinPayload(payload);
    if (!parsed) {
      return;
    }

    try {
      const resolved = await resolveMatchmakingJoin(
        getSocketUserId(socket),
        parsed.preference,
      );

      if (!resolved.ok) {
        socket.emit("matchmaking:error", {
          code: resolved.code,
          message: resolved.message,
        });
        return;
      }

      if (!isGenderPreference(resolved.preference)) {
        return;
      }

      const result = await joinForConnectedSocket(io, socket, {
        mode: parsed.mode,
        preference: resolved.preference,
        gender: resolved.ownGender,
        userId: resolved.userId,
      });
      if (!result) {
        return;
      }

      if (result.status === "waiting" || result.status === "already_waiting") {
        socket.emit("matchmaking:waiting", { mode: result.user.mode });
        return;
      }

      if (result.status === "already_matched") {
        socket.emit("match_found", toMatchFoundPayload(result.match));
        return;
      }

      emitMatchFound(io, result.match);
    } catch (error) {
      console.error(`matchmaking:join failed for ${socket.id}:`, error);
    }
  });

  socket.on("matchmaking:cancel", async () => {
    try {
      const left = await matchmakingService.leaveQueue(socket.id);
      socket.emit("matchmaking:cancelled", {
        mode: left?.mode,
      });
    } catch (error) {
      console.error(`matchmaking:cancel failed for ${socket.id}:`, error);
    }
  });

  socket.on("disconnect", () => {
    void (async () => {
      const match = await matchmakingService.getMatch(socket.id);
      await matchmakingService.handleDisconnect(socket.id);

      if (match) {
        io.to(match.peerSocketId).emit("webrtc:peer-left", {
          peerSocketId: socket.id,
        });
      }
    })().catch((error) => {
      console.error(`matchmaking disconnect cleanup failed for ${socket.id}:`, error);
    });
  });
}

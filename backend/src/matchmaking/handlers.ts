import type { Server, Socket } from "socket.io";
import { matchmakingService } from "./service.js";
import {
  parseJoinPayload,
  toMatchFoundPayload,
  type ClientToServerEvents,
  type MatchPair,
  type ServerToClientEvents,
} from "./types.js";

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
      const result = await matchmakingService.joinQueue({
        socketId: socket.id,
        mode: parsed.mode,
        preference: parsed.preference,
        gender: parsed.gender,
      });

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
    void matchmakingService.handleDisconnect(socket.id).catch((error) => {
      console.error(`matchmaking disconnect cleanup failed for ${socket.id}:`, error);
    });
  });
}

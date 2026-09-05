import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerMatchmakingHandlers } from "../matchmaking/handlers.js";
import { registerSignalingHandlers } from "../signaling/handlers.js";
import { env } from "../config/env.js";
import type { ClientToServerEvents, ServerToClientEvents } from "./events.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    registerMatchmakingHandlers(io, socket);
    registerSignalingHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

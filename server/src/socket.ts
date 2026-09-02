import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

export function setupSocket(httpServer: HttpServer, clientOrigin: string) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket/index.js";

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

const server = httpServer.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
  console.log("Socket.IO initialized");
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);

  io.close();

  server.close((error) => {
    if (error) {
      console.error("Error while closing HTTP server:", error);
      process.exit(1);
    }

    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

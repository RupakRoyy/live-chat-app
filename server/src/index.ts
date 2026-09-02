import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { setupSocket } from "./socket.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "live-chat-server" });
});

const httpServer = createServer(app);
setupSocket(httpServer, CLIENT_ORIGIN);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

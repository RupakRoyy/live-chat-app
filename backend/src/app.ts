import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { profileRouter } from "./routes/profile.js";
import { proRouter } from "./routes/pro.js";
import { redisRouter } from "./routes/redis.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: env.frontendUrl }));
  app.use(healthRouter);
  app.use(authRouter);
  app.use(profileRouter);
  app.use(proRouter);
  app.use(redisRouter);

  return app;
}

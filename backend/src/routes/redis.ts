import { Router } from "express";
import { checkRedisHealth } from "../config/redis.js";

export const redisRouter = Router();

redisRouter.get("/redis/health", async (_req, res) => {
  try {
    const ok = await checkRedisHealth();
    if (!ok) {
      res.status(503).json({
        ok: false,
        redis: "unavailable",
      });
      return;
    }

    res.json({
      ok: true,
      redis: "connected",
    });
  } catch {
    res.status(503).json({
      ok: false,
      redis: "unavailable",
    });
  }
});

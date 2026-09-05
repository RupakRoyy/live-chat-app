import { Redis } from "@upstash/redis";
import { env } from "./env.js";

export const redis = new Redis({
  url: env.upstashRedisRestUrl,
  token: env.upstashRedisRestToken,
});

export async function checkRedisHealth(): Promise<boolean> {
  const result = await redis.ping();
  return result === "PONG";
}

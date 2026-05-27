import Redis from "ioredis";
import { env } from "../env";

export const redisClient = new Redis(env.REDIS_URL);

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const count = await redisClient.incr(key);
  if (count === 1) await redisClient.expire(key, windowSeconds);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export { CacheKeys, withCache, invalidateKeys, invalidatePattern } from "./cache-keys";

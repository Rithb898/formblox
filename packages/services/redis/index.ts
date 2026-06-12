import Redis from "ioredis";
import { env } from "../env";

export const redisClient = new Redis(env.REDIS_URL);

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const lua = `
    local c = redis.call('INCR', KEYS[1])
    if c == 1 then
      redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
    end
    return c
  `;
  const count = (await redisClient.eval(lua, 1, key, windowSeconds)) as number;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export { CacheKeys, withCache, invalidateKeys, invalidatePattern } from "./cache-keys";

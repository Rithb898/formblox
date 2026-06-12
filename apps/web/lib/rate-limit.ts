import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { __aiRedis?: Redis };

const redis =
  globalForRedis.__aiRedis ??
  // These route handlers intentionally read the same server env vars as the API service.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });

// eslint-disable-next-line turbo/no-undeclared-env-vars
if (process.env.NODE_ENV !== "production") globalForRedis.__aiRedis = redis;

/**
 * Fixed-window rate limit. Mirrors packages/services/redis/index.ts:rateLimit.
 * Fails open if Redis is unreachable so public form fills can degrade gracefully.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const lua = `
      local c = redis.call('INCR', KEYS[1])
      if c == 1 then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
      end
      return c
    `;
    const count = (await redis.eval(lua, 1, key, windowSeconds)) as number;

    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}

/** Best-effort client IP from standard proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();

  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

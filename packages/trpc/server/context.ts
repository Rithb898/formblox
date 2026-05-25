import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { tokenService } from "@repo/services/token";

export interface Context {
  userId: string | null;
  ip: string | null;
  req: {
    cookies: Partial<Record<string, string>>;
  };
  res: {
    cookie(name: string, value: string, options?: Record<string, unknown>): void;
    clearCookie(name: string, options?: Record<string, unknown>): void;
  };
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  let userId: string | null = null;
  const token = (req.cookies as Partial<Record<string, string>>)?.access_token;
  if (token) {
    try {
      userId = tokenService.verifyAccessToken(token).userId;
    } catch {}
  }
  const ip = req.ip ?? null;
  return { userId, ip, req, res };
}

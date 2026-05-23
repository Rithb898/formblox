import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";
import { authService } from "@repo/services/auth";
import { redisClient } from "@repo/services/redis";

import { env } from "./env";

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FormBlox OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// Strict rate limiter for auth endpoints (5 req / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  message: { error: "Too many requests, please try again later." },
});

// General API limiter (100 req / 15 min)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
});

app.get("/", (req, res) => {
  return res.json({ message: "FormBlox is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "FormBlox server is healthy", healthy: true });
});

// Google OAuth routes
app.get("/auth/google", authLimiter, async (_req, res) => {
  const { googleOAuth2Client } = await import("@repo/services/clients/google-oauth");
  const url = googleOAuth2Client.generateAuthUrl({
    scope: ["email", "profile"],
    access_type: "offline",
  });
  res.redirect(url);
});

app.get("/auth/google/callback", authLimiter, async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
  }
  try {
    const { accessToken, refreshToken } = await authService.googleCallback(code);
    const isProd = env.NODE_ENV === "prod";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    logger.error("Google OAuth callback error", err);
    return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  apiLimiter,
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  apiLimiter,
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;

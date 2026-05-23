# Auth System — Beginner Guide

---

## Code Walkthrough: Signup + Login from Scratch

This section walks through every file you'd write, in order, to build signup and login. Each step shows the actual file path, what to write, and why.

---

### Step 1 — DB table: `users`
**File:** `packages/database/models/user.ts`

This is where a user row lives. Every auth flow creates or reads from this table.

```ts
import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
```

---

### Step 2 — DB table: `user_credentials`
**File:** `packages/database/models/user-credentials.ts`

Passwords are stored separately from the user row — cleaner, and lets you add OAuth later without a nullable password column on `users`.

```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const userCredentialsTable = pgTable("user_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
```

---

### Step 3 — DB table: `email_verification_tokens`
**File:** `packages/database/models/email-verification-tokens.ts`

After signup, user gets a one-time link. This table stores that token.
`usedAt` is null until the link is clicked.

```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const emailVerificationTokensTable = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"), // null = not yet used
});
```

---

### Step 4 — DB table: `refresh_tokens`
**File:** `packages/database/models/refresh-tokens.ts`

Stores active sessions. We never store the raw token — only a SHA-256 hash of it.
`revokedAt` is null for active sessions.

```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"), // null = still active
});
```

---

### Step 5 — Export all tables from schema
**File:** `packages/database/schema.ts`

```ts
export * from "./models/user";
export * from "./models/user-credentials";
export * from "./models/refresh-tokens";
export * from "./models/email-verification-tokens";
```

Then run the migration:
```bash
pnpm run db:generate
pnpm run db:migrate
```

---

### Step 6 — Env vars
**File:** `packages/services/env.ts`

Validate that all required secrets exist at startup. If any are missing, the app crashes immediately with a clear error instead of silently failing later.

```ts
import { z } from "zod";

const envSchema = z.object({
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  FRONTEND_URL: z.string(),
});

export const env = envSchema.parse(process.env);
```

Add to your `.env`:
```
JWT_ACCESS_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<same command, different value>
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:3000
```

---

### Step 7 — Token service
**File:** `packages/services/token/index.ts`

Two jobs: create/verify short-lived JWTs (access tokens), and manage long-lived refresh tokens in the DB.

Key insight: we never store the raw refresh token — we hash it first. If the DB leaks, stolen hashes can't be used.

```ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, eq, and, isNull } from "@repo/database";
import { refreshTokensTable } from "@repo/database/schema";
import { env } from "../env";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

class TokenService {
  // Creates a JWT that expires in 15 minutes
  createAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  }

  // Decodes a JWT — throws if invalid or expired
  verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
  }

  // Generates a random token, hashes it, stores hash in DB, returns raw token to send to browser
  async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(refreshTokensTable).values({ userId, tokenHash, expiresAt });
    return raw;
  }

  // Called when the access token expires. Revokes old refresh token, issues new one.
  // If the old token was already revoked (reuse), revoke ALL tokens — possible theft.
  async rotateRefreshToken(raw: string): Promise<{ userId: string; newRaw: string }> {
    const tokenHash = hashToken(raw);
    const [existing] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    if (!existing) throw new Error("INVALID_REFRESH_TOKEN");
    if (existing.revokedAt !== null) {
      await this.revokeAllRefreshTokens(existing.userId); // security: logout all
      throw new Error("REFRESH_TOKEN_REUSE_DETECTED");
    }
    if (existing.expiresAt < new Date()) throw new Error("REFRESH_TOKEN_EXPIRED");

    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, existing.id));

    const newRaw = await this.createRefreshToken(existing.userId);
    return { userId: existing.userId, newRaw };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const tokenHash = hashToken(raw);
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokensTable.tokenHash, tokenHash), isNull(refreshTokensTable.revokedAt)));
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokensTable.userId, userId), isNull(refreshTokensTable.revokedAt)));
  }
}

export const tokenService = new TokenService();
```

---

### Step 8 — Email service
**File:** `packages/services/email/index.ts`

Sends the verification email. Uses Resend. The link contains the raw token as a query param — the user clicks it and that token gets verified.

```ts
import { Resend } from "resend";
import { env } from "../env";

const resend = new Resend(env.RESEND_API_KEY);

class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await resend.emails.send({
      from: "noreply@yourdomain.com",
      to,
      subject: "Verify your email",
      html: `<p>Click <a href="${link}">here</a> to verify. Expires in 24 hours.</p>`,
    });
  }
}

export const emailService = new EmailService();
```

---

### Step 9 — Auth service
**File:** `packages/services/auth/index.ts`

The core logic. Three methods you need for signup+login:

```ts
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, eq, and, isNull } from "@repo/database";
import {
  usersTable,
  userCredentialsTable,
  emailVerificationTokensTable,
} from "@repo/database/schema";
import { tokenService } from "../token";
import { emailService } from "../email";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = tokenService.createAccessToken(userId);
    const refreshToken = await tokenService.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  async signup(email: string, password: string, fullName: string) {
    // 1. Reject if email taken
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (existing) throw new Error("EMAIL_TAKEN");

    // 2. Hash password (cost 12 = ~300ms, slow enough to deter brute force)
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Insert user row (emailVerified starts false)
    const [user] = await db
      .insert(usersTable)
      .values({ email, fullName, emailVerified: false })
      .returning({ id: usersTable.id });

    // 4. Store hashed password separately
    await db.insert(userCredentialsTable).values({ userId: user!.id, passwordHash });

    // 5. Create a one-time verification token (24h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailVerificationTokensTable).values({ userId: user!.id, token, expiresAt });

    // 6. Send email — no cookies yet, must verify first
    await emailService.sendVerificationEmail(email, token);
    return { message: "Check your email to verify your account." };
  }

  async verifyEmail(token: string): Promise<AuthTokens> {
    // 1. Find unused, unexpired token
    const [record] = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.token, token),
          isNull(emailVerificationTokensTable.usedAt),
        ),
      )
      .limit(1);

    if (!record) throw new Error("INVALID_VERIFICATION_TOKEN");
    if (record.expiresAt < new Date()) throw new Error("VERIFICATION_TOKEN_EXPIRED");

    // 2. Mark token used + mark user verified
    await db
      .update(emailVerificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokensTable.id, record.id));

    await db
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.id, record.userId));

    // 3. Now issue session cookies
    return this.issueTokens(record.userId);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    // 1. Find user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) throw new Error("INVALID_CREDENTIALS"); // don't say "user not found"
    if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

    // 2. Find password hash
    const [credential] = await db
      .select()
      .from(userCredentialsTable)
      .where(eq(userCredentialsTable.userId, user.id))
      .limit(1);

    if (!credential) throw new Error("INVALID_CREDENTIALS");

    // 3. Compare — bcrypt handles timing safety
    const valid = await bcrypt.compare(password, credential.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    // 4. Issue cookies
    return this.issueTokens(user.id);
  }
}

export const authService = new AuthService();
```

---

### Step 10 — tRPC context
**File:** `packages/trpc/server/context.ts`

On every incoming request, read the `access_token` cookie and decode it. This attaches `userId` to the context so any route can check "who is this?"

```ts
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { tokenService } from "@repo/services/token";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let userId: string | null = null;
  const token = req.cookies?.access_token;
  if (token) {
    try {
      userId = tokenService.verifyAccessToken(token).userId;
    } catch {} // expired or invalid — treat as logged out
  }
  return { userId, req, res };
}
```

---

### Step 11 — Protected procedure
**File:** `packages/trpc/server/trpc.ts` (add to existing file)

`protectedProcedure` is just `publicProcedure` with a guard. Any route using it will automatically 401 if no valid `access_token` cookie exists.

```ts
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } }); // userId is now non-null
});
```

---

### Step 12 — tRPC auth router
**File:** `packages/trpc/server/routes/auth/route.ts`

Three procedures for signup+login. The key thing here: **cookies are set/cleared here on `ctx.res`**, not inside the service. The service just returns tokens; the router decides where they go.

```ts
import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { authService } from "@repo/services/auth";
import { TRPCError } from "@trpc/server";

const COOKIE_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000, // 15 min
  path: "/",
};

const COOKIE_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, COOKIE_ACCESS);
  res.cookie("refresh_token", refreshToken, COOKIE_REFRESH);
}

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1).max(80),
    }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await authService.signup(input.email, input.password, input.fullName);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "EMAIL_TAKEN") throw new TRPCError({ code: "CONFLICT", message: "Email already in use." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
      }
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { accessToken, refreshToken } = await authService.verifyEmail(input.token);
        setAuthCookies(ctx.res, accessToken, refreshToken); // sets cookies on the browser
        return { success: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INVALID_VERIFICATION_TOKEN") throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or used link." });
        if (msg === "VERIFICATION_TOKEN_EXPIRED") throw new TRPCError({ code: "BAD_REQUEST", message: "Link expired." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
      }
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { accessToken, refreshToken } = await authService.login(input.email, input.password);
        setAuthCookies(ctx.res, accessToken, refreshToken);
        return { success: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INVALID_CREDENTIALS") throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        if (msg === "EMAIL_NOT_VERIFIED") throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email first." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
      }
    }),
});
```

---

### Step 13 — Express server setup
**File:** `apps/api/src/server.ts`

Two things must happen here: `cookieParser()` so Express can read cookies, and CORS with `credentials: true` so the browser sends cookies cross-origin.

```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { serverRouter, createContext } from "@repo/trpc/server";

export const app = express();

app.use(cors({
  origin: "http://localhost:3000", // your frontend URL
  credentials: true, // REQUIRED — without this, browser won't send cookies
}));

app.use(cookieParser()); // REQUIRED — without this, req.cookies is undefined
app.use(express.json());

app.use("/trpc", trpcExpress.createExpressMiddleware({ router: serverRouter, createContext }));
```

---

### Step 14 — Frontend: Signup page
**File:** `apps/web/app/(auth)/signup/page.tsx`

Form with validation via `react-hook-form` + `zod`. On success, shows a "check your email" message instead of redirecting (user must verify first).

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";

const schema = z
  .object({
    fullName: z.string().min(1, "Name required").max(80),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [done, setDone] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (done) return <p>Check your email to verify your account.</p>;

  return (
    <form onSubmit={handleSubmit(({ fullName, email, password }) =>
      signupMutation.mutate({ fullName, email, password })
    )}>
      <input placeholder="Full name" {...register("fullName")} />
      {errors.fullName && <p>{errors.fullName.message}</p>}

      <input type="email" placeholder="Email" {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" placeholder="Password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}

      <input type="password" placeholder="Confirm password" {...register("confirmPassword")} />
      {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

      <button type="submit" disabled={signupMutation.isPending}>
        {signupMutation.isPending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
```

---

### Step 15 — Frontend: Verify email page
**File:** `apps/web/app/(auth)/verify-email/page.tsx`

Reads `?token=` from the URL, auto-fires the mutation on mount. No button to press — just land on the page and it works.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const called = useRef(false); // prevent double-fire in React strict mode

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setTimeout(() => router.push("/dashboard"), 2000);
    },
  });

  useEffect(() => {
    if (token && !called.current) {
      called.current = true;
      verifyMutation.mutate({ token });
    }
  }, [token]);

  if (verifyMutation.isPending) return <p>Verifying...</p>;
  if (verifyMutation.isSuccess) return <p>Verified! Redirecting...</p>;
  if (verifyMutation.isError) return <p>Error: {verifyMutation.error.message}</p>;
  return null;
}
```

---

### Step 16 — Frontend: Login page
**File:** `apps/web/app/(auth)/login/page.tsx`

On success, `router.push("/dashboard")` — the cookies are already set by the server response before this callback fires.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => router.push("/dashboard"), // cookies already set
    onError: (err) => toast.error(err.message),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
      <input type="email" placeholder="Email" {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" placeholder="Password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

---

### Step 17 — Frontend: Auth state
**File:** `apps/web/providers/auth.tsx`

Wrap your app in this. On mount it calls `trpc.auth.me` — if that 401s (expired access token), it tries a silent refresh. This runs once on page load so every component can access the current user.

```tsx
"use client";

import { useEffect } from "react";
import { trpc } from "~/trpc/client";
import { useAuthStore } from "~/stores/auth"; // your Zustand store

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { _setUser, _setLoading } = useAuthStore();

  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const refreshMutation = trpc.auth.refreshToken.useMutation();

  useEffect(() => {
    if (meQuery.data) {
      _setUser(meQuery.data);
      _setLoading(false);
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (!meQuery.error) return;
    // Access token expired — try silent refresh
    refreshMutation.mutate(undefined, {
      onSuccess: () => meQuery.refetch(),
      onError: () => { _setUser(null); _setLoading(false); },
    });
  }, [meQuery.error]);

  return <>{children}</>;
}
```

---

### How it all connects

```
User fills signup form
  → trpc.auth.signup (Step 16)
  → authRouter.signup (Step 12)
  → authService.signup (Step 9)
    → hash password (bcrypt)
    → insert users row (Step 1)
    → insert user_credentials row (Step 2)
    → insert email_verification_tokens row (Step 3)
    → emailService.sendVerificationEmail (Step 8)
  → returns { message: "Check your email" }
  → UI shows "check your email" state

User clicks email link → lands on /verify-email?token=abc
  → trpc.auth.verifyEmail (Step 15)
  → authRouter.verifyEmail (Step 12)
  → authService.verifyEmail (Step 9)
    → finds token in DB
    → marks token used
    → sets user.emailVerified = true
    → tokenService.createAccessToken (Step 7)
    → tokenService.createRefreshToken (Step 7) → stored in refresh_tokens (Step 4)
  → setAuthCookies on ctx.res (access_token 15min, refresh_token 7d)
  → router.push("/dashboard")

User fills login form
  → trpc.auth.login (Step 16)
  → authRouter.login (Step 12)
  → authService.login (Step 9)
    → finds user, checks emailVerified
    → bcrypt.compare(input, hash)
    → tokenService.issueTokens
  → setAuthCookies
  → router.push("/dashboard")

On every page load
  → AuthProvider (Step 17) calls trpc.auth.me
  → createContext (Step 10) reads access_token cookie → attaches userId
  → protectedProcedure (Step 11) checks userId is not null
  → authService.me returns user data
```

---

## What the auth does

Users can sign up with email/password or Google. After login, two cookies are set in the browser:
- `access_token` — short-lived JWT (15 min), proves who you are on each request
- `refresh_token` — long-lived (7 days), used to silently get a new access token when it expires

Neither token is readable by JavaScript — they're `httpOnly` cookies, browser sends them automatically.

---

## The 5 database tables involved

| Table | Purpose |
|---|---|
| `users` | Core user record (email, name, emailVerified) |
| `user_credentials` | Stores hashed password (separate from user) |
| `oauth_accounts` | Links Google account to a user |
| `refresh_tokens` | All active sessions; revoked on logout |
| `email_verification_tokens` | One-time tokens sent via email to verify address |
| `password_reset_tokens` | One-time tokens for password reset |

---

## Flow 1: Signup + Email Verify

```
User fills form → POST signup
  → creates user (emailVerified=false)
  → hashes password, stores in user_credentials
  → generates random token, stores in email_verification_tokens
  → sends email with link: /verify-email?token=...
  → returns "check your email" (NO cookies yet)

User clicks link → POST verifyEmail
  → finds token in DB, checks not expired/used
  → sets user.emailVerified = true
  → marks token used
  → issues access_token + refresh_token cookies
  → user is now logged in
```

## Flow 2: Login

```
User submits email+password → POST login
  → finds user, checks emailVerified = true
  → finds user_credentials, bcrypt.compare(input, hash)
  → if match → issues cookies
```

## Flow 3: Google OAuth

```
User clicks "Sign in with Google"
  → browser goes to GET /auth/google (Express route)
  → Express redirects to Google
  → Google redirects back to GET /auth/google/callback
  → server exchanges code for tokens, reads email/name from Google
  → if oauth_accounts row exists for this Google ID → log in that user
  → else if user with same email exists → auto-link, log in
  → else → create new user
  → issues cookies, redirects to frontend
```

## Flow 4: Silent Token Refresh

Access token expires every 15 min. Frontend handles this automatically:

```
AuthProvider mounts → calls trpc.auth.me
  → if success → user is logged in
  → if 401 error → calls trpc.auth.refreshToken
    → server reads refresh_token cookie, rotates it (old revoked, new issued)
    → sets new cookies
    → frontend retries trpc.auth.me
    → if still fails → user is logged out
```

## Flow 5: Forgot/Reset Password

```
User submits email → POST forgotPassword
  → silently succeeds even if email not found (no enumeration)
  → invalidates old reset tokens
  → sends email with link: /reset-password?token=...

User submits new password → POST resetPassword
  → validates token not expired/used
  → hashes new password, updates user_credentials
  → marks token used
  → revokes ALL refresh tokens (forces re-login on all devices)
```

---

## Key files to know

| File | What it does |
|---|---|
| `packages/services/auth/index.ts` | All business logic (signup, login, etc.) |
| `packages/services/token/index.ts` | Create/verify/rotate JWTs and refresh tokens |
| `packages/services/email/index.ts` | Send emails via Resend |
| `packages/trpc/server/routes/auth/route.ts` | API endpoints, sets/clears cookies |
| `packages/trpc/server/context.ts` | Reads access_token cookie, attaches userId to every request |
| `apps/web/providers/auth.tsx` | Frontend: loads user on mount, handles silent refresh |
| `apps/web/stores/auth.ts` | Frontend state: current user, logout functions |
| `apps/web/proxy.ts` | Next.js middleware: redirects unauthenticated users to /login |

---

## Protected vs public routes

- **Public procedure** — anyone can call (login, signup, etc.)
- **Protected procedure** — requires valid `access_token` cookie; throws 401 otherwise
- Defined in `packages/trpc/server/trpc.ts` as `protectedProcedure`

---

## Implementation order (if building from scratch)

1. Create DB tables + run migration (`pnpm run db:migrate`)
2. Add env vars (JWT secrets, Google OAuth creds, Resend key, Redis URL)
3. `packages/services/redis/index.ts` — Redis client
4. `packages/services/token/index.ts` — JWT + refresh token logic
5. `packages/services/email/index.ts` — email sender
6. `packages/services/auth/index.ts` — core auth logic
7. `packages/trpc/server/context.ts` — attach userId to tRPC context
8. `packages/trpc/server/trpc.ts` — add `protectedProcedure`
9. `packages/trpc/server/routes/auth/route.ts` — expand the router
10. `apps/api/src/server.ts` — add `cookieParser`, CORS with credentials, rate limiting, Google OAuth routes
11. `apps/web/proxy.ts` — route guards
12. `apps/web/providers/auth.tsx` — auth context
13. `apps/web/app/(auth)/**` — login/signup/etc pages

---

## Required env vars

```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8123/auth/google/callback
JWT_ACCESS_SECRET=<32-byte random hex>
JWT_REFRESH_SECRET=<32-byte random hex>
RESEND_API_KEY=
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```

Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Security notes

- Passwords never stored plain — bcrypt with cost 12
- Tokens in httpOnly cookies — JS can't read them (XSS protection)
- Refresh token reuse detected → all sessions for that user revoked
- Forgot password never reveals if email exists
- Rate limiting on auth endpoints: 5 req/15min (strict), 100 req/15min (normal)

# Production-Ready Auth System Plan

## Context

Formblox is a Turborepo monorepo (Next.js 16 frontend + Express/tRPC backend + Drizzle/Postgres). No auth exists yet — only a stub `getSupportedAuthenticationProviders` endpoint and a partial Google OAuth client. This plan adds full email/password + Google OAuth login with JWT sessions, email verification, password reset, rate limiting (Redis), and all frontend auth pages.

## Decisions Locked In

- **Sessions**: JWT — 15min access token + 7-day rotating refresh token, both in HTTP-only cookies
- **Hashing**: bcrypt
- **Email**: Resend (verification + password reset)
- **OAuth flow**: Server-side redirect via Express (`GET /auth/google` → Google → `GET /auth/google/callback`)
- **Account linking**: Auto-link Google email to existing email/password account
- **Rate limiting**: Redis-backed (`rate-limit-redis` + `ioredis`; user has Redis already)
- **Token rotation**: Refresh tokens rotate on each use; reuse = revoke all
- **Logout all devices**: Yes (delete all refresh_tokens for user_id)
- **Frontend guards**: `proxy.ts` (Next.js 16 middleware equivalent)
- **Frontend pages**: Full UI — login, signup, verify-email, forgot-password, reset-password

---

## 1. Database Schema — `packages/database/models/`

### New tables (new Drizzle migration):

**`user_credentials`** — stores password hash separately from user

```
id uuid PK, user_id uuid FK→users, password_hash text NOT NULL, created_at, updated_at
```

**`oauth_accounts`** — links OAuth providers to users

```
id uuid PK, user_id uuid FK→users, provider varchar (GOOGLE), provider_user_id varchar,
access_token text, token_expires_at timestamp, created_at
UNIQUE(provider, provider_user_id)
```

**`refresh_tokens`** — rotating refresh tokens

```
id uuid PK, user_id uuid FK→users, token_hash text NOT NULL UNIQUE,
expires_at timestamp NOT NULL, created_at, revoked_at timestamp (nullable)
```

**`email_verification_tokens`** — one-time email verification

```
id uuid PK, user_id uuid FK→users, token text NOT NULL UNIQUE,
expires_at timestamp NOT NULL, created_at, used_at timestamp (nullable)
```

**`password_reset_tokens`** — one-time password reset

```
id uuid PK, user_id uuid FK→users, token text NOT NULL UNIQUE,
expires_at timestamp NOT NULL, created_at, used_at timestamp (nullable)
```

Update `packages/database/schema.ts` to export all new tables.
Run `drizzle-kit generate` + `drizzle-kit migrate`.

---

## 2. New npm Packages

**`packages/services`**: `bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken resend ioredis`
**`apps/api`**: `cookie-parser @types/cookie-parser express-rate-limit rate-limit-redis`

---

## 3. Services — `packages/services/`

### `packages/services/env.ts` — uncomment + add vars:

```
GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI,
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, RESEND_API_KEY, REDIS_URL, FRONTEND_URL
```

### `packages/services/redis/index.ts`

Ioredis client singleton, exported as `redisClient`.

### `packages/services/token/index.ts` — TokenService

- `createAccessToken(userId)` → sign JWT, 15min, `JWT_ACCESS_SECRET`
- `createRefreshToken(userId)` → crypto.randomBytes(64), hash with SHA-256, store in `refresh_tokens` table (expires 7 days), return raw token
- `verifyAccessToken(token)` → verify JWT, return `{ userId }`
- `rotateRefreshToken(rawToken)` → hash raw token, find in DB, check not revoked/expired; if reused (already revoked) → `logoutAll(userId)` + throw; otherwise revoke old, create new, return new raw token
- `revokeRefreshToken(rawToken)` → set `revoked_at = now()`
- `revokeAllRefreshTokens(userId)` → update where `user_id = userId AND revoked_at IS NULL`

### `packages/services/email/index.ts` — EmailService using Resend

- `sendVerificationEmail(to, token)` → link = `${FRONTEND_URL}/verify-email?token=...`
- `sendPasswordResetEmail(to, token)` → link = `${FRONTEND_URL}/reset-password?token=...`

### `packages/services/auth/index.ts` — AuthService

- `signup(email, password, fullName)`:
  1. Check email not taken
  2. `bcrypt.hash(password, 12)`
  3. Insert user (emailVerified=false) + user_credentials row
  4. Create email_verification_token (expires 24h)
  5. `emailService.sendVerificationEmail(email, token)`
  6. Return user (no tokens yet — must verify first)

- `verifyEmail(token)`:
  1. Find token, check not used/expired
  2. Set `users.email_verified = true`, mark token `used_at = now()`
  3. Issue access + refresh tokens (return in cookies)

- `login(email, password)`:
  1. Find user, check `email_verified = true`
  2. Find credential, `bcrypt.compare`
  3. Issue tokens

- `googleCallback(code)`:
  1. Exchange code for Google tokens via `googleOAuth2Client`
  2. Verify ID token, extract `{email, sub, name, picture}`
  3. Check `oauth_accounts` for existing link → if found, get user
  4. Else check `users` by email → if found, auto-link (insert oauth_account, set `email_verified=true`)
  5. Else create new user + oauth_account
  6. Issue tokens

- `refreshToken(rawToken)` → delegate to `tokenService.rotateRefreshToken`
- `logout(rawToken)` → `tokenService.revokeRefreshToken`
- `logoutAll(userId)` → `tokenService.revokeAllRefreshTokens`
- `forgotPassword(email)`:
  1. Find user (silently succeed if not found — no email enumeration)
  2. Invalidate old reset tokens for user
  3. Create `password_reset_tokens` (expires 1h)
  4. `emailService.sendPasswordResetEmail`

- `resetPassword(token, newPassword)`:
  1. Find token, check not used/expired
  2. Hash new password, upsert `user_credentials`
  3. Mark token used, revoke all refresh tokens (force re-login)

- `me(userId)` → find user by id, return public fields

---

## 4. tRPC Context — `packages/trpc/server/context.ts`

Parse `access_token` cookie from request, call `tokenService.verifyAccessToken`. Attach `userId` (or null) to context.

Requires Express `req` in context — update `createContext` to accept `{ req, res }`:

```ts
export async function createContext({ req, res }: CreateExpressContextOptions) {
  const token = req.cookies?.access_token;
  let userId: string | null = null;
  if (token) {
    try {
      userId = tokenService.verifyAccessToken(token).userId;
    } catch {}
  }
  return { userId, req, res };
}
```

---

## 5. tRPC Procedures — `packages/trpc/server/trpc.ts`

Add `protectedProcedure`:

```ts
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
```

---

## 6. tRPC Auth Router — `packages/trpc/server/routes/auth/route.ts`

Expand with new mutations (keep existing `getSupportedAuthenticationProviders`):

| Procedure        | Type     | Auth      | Description                             |
| ---------------- | -------- | --------- | --------------------------------------- |
| `signup`         | mutation | public    | `{ email, password, fullName }` → 201   |
| `verifyEmail`    | mutation | public    | `{ token }` → sets cookies              |
| `login`          | mutation | public    | `{ email, password }` → sets cookies    |
| `logout`         | mutation | public    | clears cookies, revokes token           |
| `logoutAll`      | mutation | protected | revokes all tokens for user             |
| `refreshToken`   | mutation | public    | rotates refresh token, sets new cookies |
| `forgotPassword` | mutation | public    | `{ email }` → sends email               |
| `resetPassword`  | mutation | public    | `{ token, newPassword }`                |
| `me`             | query    | protected | returns current user                    |

Cookie-setting helper: set `access_token` (httpOnly, 15min) and `refresh_token` (httpOnly, 7d) on `ctx.res`.

---

## 7. Express Server — `apps/api/src/server.ts`

### Add middleware:

```ts
import cookieParser from "cookie-parser";
app.use(cookieParser());
```

### Update CORS (must allow credentials):

```ts
cors({ origin: env.FRONTEND_URL, credentials: true });
```

### Add rate limiting (before auth routes):

```ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
// Strict: 5 req/15min for auth mutations
// Normal: 100 req/15min for other API
```

Apply strict limiter to `/auth/google`, `/auth/google/callback`, and tRPC auth procedures via Express prefix.

### Add Google OAuth routes (non-tRPC):

```ts
GET /auth/google → redirect to googleOAuth2Client.generateAuthUrl({ scope: ['email','profile'] })
GET /auth/google/callback → authService.googleCallback(code) → set cookies → redirect to FRONTEND_URL
```

### `apps/api/src/env.ts` — add `FRONTEND_URL`, `REDIS_URL`

---

## 8. Frontend — `apps/web/`

### `proxy.ts` (Next.js 16 middleware):

- Protected routes: all except `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/api/*`, `/_next/*`
- If no `access_token` cookie → redirect `/login`
- If authenticated and on `/login` or `/signup` → redirect `/dashboard`

### Auth Provider — `providers/auth.tsx`

- React context with `user`, `isLoading`, `logout()`, `logoutAll()`
- On mount: call `trpc.auth.me` — if 401, try `trpc.auth.refreshToken`, then retry
- Store user in state

### New pages (use existing Radix UI + React Hook Form + Zod):

**`app/(auth)/layout.tsx`** — centered card layout

**`app/(auth)/login/page.tsx`**

- Email + password form
- "Sign in with Google" button → `window.location.href = API_URL + '/auth/google'`
- Link to `/signup`, `/forgot-password`
- tRPC: `trpc.auth.login.mutate` → on success redirect `/dashboard`

**`app/(auth)/signup/page.tsx`**

- Full name, email, password, confirm password
- tRPC: `trpc.auth.signup.mutate` → on success show "check your email" message

**`app/(auth)/verify-email/page.tsx`**

- Read `?token=` from URL
- Auto-call `trpc.auth.verifyEmail.mutate({ token })` on mount
- Show success/error state

**`app/(auth)/forgot-password/page.tsx`**

- Email input
- tRPC: `trpc.auth.forgotPassword.mutate` → show "if account exists, email sent"

**`app/(auth)/reset-password/page.tsx`**

- Read `?token=` from URL
- New password + confirm
- tRPC: `trpc.auth.resetPassword.mutate` → redirect `/login`

---

## 9. Environment Variables to Add (`.env`)

```
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8123/auth/google/callback

# JWT
JWT_ACCESS_SECRET=<random-32-byte-hex>
JWT_REFRESH_SECRET=<random-32-byte-hex>

# Email
RESEND_API_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 10. Implementation Order

1. `packages/database/models/*` — new tables
2. `packages/database/schema.ts` — export new tables + run migration
3. `packages/services/env.ts` — new vars
4. `packages/services/redis/index.ts`
5. `packages/services/token/index.ts`
6. `packages/services/email/index.ts`
7. `packages/services/auth/index.ts`
8. `packages/trpc/server/context.ts`
9. `packages/trpc/server/trpc.ts` — add protectedProcedure
10. `packages/trpc/server/routes/auth/route.ts` — expand router
11. `apps/api/src/env.ts` + `server.ts`
12. `apps/web/proxy.ts`
13. `apps/web/providers/auth.tsx`
14. `apps/web/app/(auth)/**`

---

## Verification

1. `pnpm run db:migrate` — confirm new tables in Postgres
2. Start API + web dev servers
3. **Signup** → check verification email received
4. **Verify email** → click link → `email_verified = true` in DB
5. **Login** → `access_token` + `refresh_token` cookies set
6. **Me** → returns current user
7. **Refresh** → delete access_token cookie, call refreshToken → new cookie
8. **Google OAuth** → full flow completes, cookies set
9. **Rate limiting** → 6th rapid request to auth endpoint → 429
10. **Logout all** → all refresh_tokens revoked
11. **Password reset** → full forgot → reset flow works
12. **Protected route** → no cookies → redirect to `/login`

# Plan 002: Strict rate limiting on credential endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat da38d0e..HEAD -- apps/api/src/server.ts packages/trpc/server/routes/auth/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `da38d0e`, 2026-06-12

## Why this matters

The Express server defines a **strict** auth limiter (5 requests / 15 min) but
mounts it **only** on the two Google OAuth routes (`/auth/google`,
`/auth/google/callback`). The actual credential endpoints — password login,
signup, forgot-password, reset-password, verify-email — are tRPC mutations served
under `/trpc` and `/api`, which only get the **general** limiter (100 req /
15 min). That is far too loose for password endpoints: 100 password guesses per
window per IP enables practical brute-forcing, and 100 forgot-password calls
enables reset-email spam / account harassment. After this plan, the credential
mutations are protected by a strict per-IP limit equivalent to the existing
`authLimiter`, without throttling ordinary read/query traffic.

Secondary issue (fix included): both limiters `skip()` entirely unless
`NODE_ENV === "prod"`, so they are inert in any non-`prod` deployment. This is
fine for local dev but means a staging environment has zero protection. This plan
leaves the dev-skip behavior intact (per existing intent) but documents it; do
not change the skip semantics unless the operator asks.

## Current state

`apps/api/src/server.ts` — the Express entrypoint. Relevant excerpts:

Strict limiter (lines ~41–55) currently used only by OAuth:
```ts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
  handler: (_req, res) => {
    res.redirect(`${env.FRONTEND_URL}/login?error=rate_limited`);
  },
});
```

General limiter (lines ~57–67):
```ts
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
});
```

OAuth mounts (lines ~82, ~101): `app.get("/auth/google", authLimiter, ...)` and
`app.get("/auth/google/callback", authLimiter, ...)`.

tRPC mounts (lines ~145–161) — note both use only `apiLimiter`:
```ts
app.use(
  "/api",
  apiLimiter,
  createOpenApiExpressMiddleware({ router: serverRouter, createContext }),
);

app.use(
  "/trpc",
  apiLimiter,
  trpcExpress.createExpressMiddleware({ router: serverRouter, createContext }),
);
```

The credential mutations live in `packages/trpc/server/routes/auth/route.ts`:
`signup`, `login`, `verifyEmail`, `forgotPassword`, `resetPassword`,
`refreshToken`, `logout`, `logoutAll`. The OpenAPI REST paths are generated under
`/authentication/*` (e.g. `POST /api/authentication/login`,
`/api/authentication/signup`, `/api/authentication/forgot-password`,
`/api/authentication/reset-password`, `/api/authentication/verify-email`). The
tRPC procedure paths under `/trpc` look like `/trpc/auth.login`,
`/trpc/auth.signup`, etc. (router key is `auth` — confirm in
`packages/trpc/server/index.ts` / `routes/route.ts` how the auth router is keyed
before relying on the exact name).

### Why a path-prefix middleware (not per-procedure)

tRPC batches calls and the limiter is Express-level, so the clean lever is an
Express middleware mounted **before** the tRPC/OpenAPI handlers that inspects the
request path and applies the strict limiter only to credential operations. This
keeps all rate-limit policy in `server.ts` next to the existing limiters and
touches no tRPC code.

## Commands you will need

| Purpose   | Command (run from repo root)        | Expected on success |
|-----------|-------------------------------------|---------------------|
| Install   | `pnpm install`                      | exit 0              |
| Typecheck | `pnpm --filter @repo/api check-types` | exit 0, no errors |
| Build     | `pnpm --filter @repo/api build`     | exit 0 (tsup)       |
| Lint      | `pnpm --filter @repo/api lint`      | exit 0              |

There is no test runner in this repo — do not attempt `pnpm test`.
Note: the API `package.json` script is `"check-types"` only if present; if
`pnpm --filter @repo/api check-types` reports "command not found", use
`pnpm --filter @repo/api build` (tsup typechecks) as the gate instead and note it.

## Scope

**In scope** (only file you should modify):
- `apps/api/src/server.ts`

**Out of scope** (do NOT touch):
- `packages/trpc/server/routes/auth/route.ts` and any tRPC code — policy stays
  in Express.
- The `apiLimiter` / `authLimiter` definitions' `skip` semantics — leave the
  dev-skip behavior as-is unless the operator asks otherwise.
- `apps/web/**` — AI route protection is plan 001.

## Git workflow

- Branch: `advisor/002-strict-auth-rate-limit`
- Commit style: one-line conventional-commit message, no body (matches
  `git log`, e.g. `feat: integrate PostHog for analytics tracking`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the credential paths

Before editing, confirm the exact request paths the credential mutations expose.
Run:
```
grep -rn "getPath(" packages/trpc/server/routes/auth/route.ts
grep -n "generatePath" packages/trpc/server/utils/path-generator.ts
```
`getPath = generatePath("/authentication")`, so REST paths are
`/authentication/login`, `/authentication/signup`,
`/authentication/forgot-password`, `/authentication/reset-password`,
`/authentication/verify-email`. These are reached as `/api/authentication/...`.
For the `/trpc` batch endpoint, the procedure name appears in the URL/body as
`auth.login`, `auth.signup`, etc.

If the router is NOT keyed `auth` or the path prefix is NOT `/authentication`,
**STOP** and report the actual values — the matcher in Step 2 depends on them.

### Step 2: Add a strict credential limiter and matcher middleware

In `apps/api/src/server.ts`, after the `apiLimiter` definition and before the
`/api` and `/trpc` mounts, add:

```ts
// Sensitive credential operations — strict per-IP limit (10 / 15 min).
// Mounted ahead of the tRPC/OpenAPI handlers; only matches auth paths.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => redisClient.call(...(args as [string, ...string[]])) as any,
  }),
  skip: () => env.NODE_ENV !== "prod",
  message: { error: "rate_limited" },
});

// Operations that must be tightly throttled regardless of transport (REST or tRPC).
const CREDENTIAL_PATTERNS = [
  /\/authentication\/(login|signup|forgot-password|reset-password|verify-email)/,
  /auth\.(login|signup|forgotPassword|resetPassword|verifyEmail)/,
];

function credentialGuard(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const target = `${req.path}${req.url}`;
  if (CREDENTIAL_PATTERNS.some((re) => re.test(target))) {
    return credentialLimiter(req, res, next);
  }
  return next();
}
```

Notes:
- `max: 10` over 15 min is slightly more forgiving than the OAuth limiter's `5`
  because login + a couple of retries is normal; still far below 100. If the
  operator prefers parity with OAuth, change to `5`.
- Use a JSON `message` (not the OAuth `handler` redirect) — these endpoints are
  API/XHR calls, not browser navigations, so a 429 JSON body is correct.

### Step 3: Mount the guard before the tRPC/OpenAPI handlers

Update the `/api` and `/trpc` mounts to run `credentialGuard` first, keeping the
existing `apiLimiter` as the general limiter:

```ts
app.use(
  "/api",
  credentialGuard,
  apiLimiter,
  createOpenApiExpressMiddleware({ router: serverRouter, createContext }),
);

app.use(
  "/trpc",
  credentialGuard,
  apiLimiter,
  trpcExpress.createExpressMiddleware({ router: serverRouter, createContext }),
);
```

Order matters: `credentialGuard` runs first so credential calls consume the
strict bucket; everything else falls through to `apiLimiter`. (A blocked
credential call returns 429 from `credentialLimiter` and never reaches
`apiLimiter` — acceptable, the request is rejected either way.)

**Verify**: typecheck/build gate from the commands table → exit 0.

### Step 4: Lint and build

Run `pnpm --filter @repo/api lint` and `pnpm --filter @repo/api build`.

**Verify**: both exit 0.

## Test plan

No test runner exists. Verify by build/lint plus an optional manual check (only
if Redis + the API are runnable and `NODE_ENV=prod` is set, since the limiter
skips otherwise):

1. `NODE_ENV=prod pnpm --filter @repo/api dev` (needs Postgres + Redis).
2. Loop 12 logins with a bad password against `/api/authentication/login`:
   ```
   for i in $(seq 1 12); do
     curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8123/api/authentication/login \
       -H 'content-type: application/json' -d '{"email":"x@x.com","password":"wrong"}';
   done
   ```
   → first ~10 return `401`, then `429`.
3. Confirm a normal GET query (e.g. `/api/public/forms`) still returns `200`
   after the login bucket is exhausted (proves the strict limiter is scoped).

If you cannot run the server, state that and rely on the build/lint gate.

## Done criteria

ALL must hold:

- [ ] `pnpm --filter @repo/api build` exits 0 (or `check-types` if the script exists)
- [ ] `pnpm --filter @repo/api lint` exits 0
- [ ] `grep -n "credentialLimiter" apps/api/src/server.ts` → defined once
- [ ] `grep -n "credentialGuard" apps/api/src/server.ts` → mounted on both `/api` and `/trpc`
- [ ] The `authLimiter` and `apiLimiter` definitions are unchanged (only additions made)
- [ ] `git status --porcelain` shows only `apps/api/src/server.ts` modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The auth router key or REST path prefix differs from `auth.*` /
  `/authentication/*` (Step 1) — the regex matcher would silently miss.
- `express.Request`/`Response`/`NextFunction` types aren't importable as shown
  (this project uses Express 5 + `@types/express` 5) — report the actual types.
- The build fails twice after a reasonable fix attempt.
- You find the request path at middleware time does not include the procedure
  name for `/trpc` batched calls (inspect `req.url` / `req.path` for a real tRPC
  request) — if so, the `/trpc` regex needs the query string; report what you
  observed rather than guessing.

## Maintenance notes

- The `/trpc` matcher relies on the procedure name appearing in the URL. tRPC's
  HTTP link puts it in the path for non-batched and in the path + `?batch=1` for
  batched calls; the combined `${req.path}${req.url}` target covers both. If the
  web client switches to a different tRPC link/transport, re-verify the regex.
- Both limiters skip when `NODE_ENV !== "prod"`. If a staging environment is
  added, decide whether to enable limiting there (would require touching the
  `skip` predicates — deferred out of this plan).
- Reviewer should scrutinize: the regexes match exactly the intended operations
  and nothing else (especially that read queries are untouched), and that the
  strict limiter sits before `apiLimiter` in the chain.

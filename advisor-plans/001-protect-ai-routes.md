# Plan 001: AI route handlers require auth and/or rate limiting

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat da38d0e..HEAD -- apps/web/app/api/ai apps/web/lib/ai.ts apps/web/package.json`
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

The three AI route handlers under `apps/web/app/api/ai/` each call a **paid
LLM** (`gpt-5.4-mini` via `apps/web/lib/ai.ts`) and have **no authentication and
no rate limiting whatsoever**. The Next.js dev/prod server (port 3000) is a
separate process from the Express API (port 8123), so the Redis-backed
`express-rate-limit` in `apps/api/src/server.ts` does **not** cover these
routes. Any anonymous internet client can `POST` to `/api/ai/generate-form` or
`/api/ai/summary` in a loop and (a) run up an unbounded OpenAI bill and (b) use
the deployment as a free LLM proxy. `/api/ai/followup` is called by anonymous
form respondents (by design — it must stay unauthenticated) but is equally
uncapped. After this plan: `generate-form` and `summary` require a valid logged-in
user; all three are rate-limited per identity/IP using the same Redis the rest of
the app already uses.

## Current state

Files and roles:
- `apps/web/app/api/ai/generate-form/route.ts` — `POST`, called from the
  **authenticated** dashboard (`apps/web/app/(dashboard)/forms/page.tsx:497`).
  Generates a form from a prompt via `generateObject`.
- `apps/web/app/api/ai/summary/route.ts` — `POST`, called from the
  **authenticated** dashboard (`apps/web/app/(dashboard)/forms/[formId]/summary/page.tsx:35`).
  Streams an analytics summary.
- `apps/web/app/api/ai/followup/route.ts` — `POST`, called from the **public**
  form runner (`apps/web/app/f/[slug]/_components/form-runner.tsx:344`) by
  anonymous respondents. **Must remain unauthenticated** — only rate-limit it.
- `apps/web/lib/ai.ts` — exports `aiModel` and the system prompts.

None of the three route handlers read cookies or check identity. Representative
current shape (`apps/web/app/api/ai/followup/route.ts` in full):

```ts
import { streamText } from "ai";
import { z } from "zod";
import { aiModel, FOLLOWUP_SYSTEM_PROMPT } from "~/lib/ai";

const bodySchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { question, answer } = parsed.data;

  const result = streamText({
    model: aiModel,
    system: FOLLOWUP_SYSTEM_PROMPT,
    prompt: `Original question: "${question}"\nTheir answer: "${answer}"\n\nAsk one follow-up question:`,
    maxOutputTokens: 100,
  });

  return result.toTextStreamResponse();
}
```

`generate-form/route.ts` and `summary/route.ts` follow the same `safeParse` →
return 400 → call the model pattern (see their full files before editing).

### Conventions to reuse (do NOT reinvent)

The repo already has a Redis rate-limit primitive and a JWT helper. **Match
their behavior exactly** so the AI routes are consistent with the rest of the app.

1. Redis rate limit — `packages/services/redis/index.ts`:
   ```ts
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
   ```
   The public-form submit endpoint uses it like this
   (`packages/trpc/server/routes/forms/public.ts`, `submit`):
   ```ts
   const ip = ctx.ip ?? "unknown";
   const { allowed } = await rateLimit(`responses:submit:${ip}:${input.slug}`, 10, 60);
   if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });
   ```

2. JWT access-token verification — `packages/services/token/index.ts`:
   ```ts
   verifyAccessToken(token: string): AccessTokenPayload {
     const raw = jwt.verify(token, env.JWT_ACCESS_SECRET);
     return accessTokenPayloadSchema.parse(raw);  // { userId: string }
   }
   ```
   The access token lives in the `access_token` cookie (set with `httpOnly`).

### Why new local helpers instead of importing `@repo/services`

`apps/web` does **not** depend on `@repo/services`, and that package's modules
eagerly construct a Postgres connection (`@repo/database`) on import. Pulling it
into Next.js route handlers would drag the DB client into the web runtime. The
clean, low-coupling move is two tiny web-local helpers using `ioredis` and
`jsonwebtoken` directly, pointed at the **same** `REDIS_URL` and
`JWT_ACCESS_SECRET` env vars (both already present in the root `.env`, which
turbo loads via `dotenv --` for the web `dev`/`build` scripts — confirmed by the
existing `process.env.OPENAI_API_KEY` use in `apps/web/lib/ai.ts`).

## Commands you will need

| Purpose   | Command (run from repo root)                  | Expected on success |
|-----------|-----------------------------------------------|---------------------|
| Install   | `pnpm install`                                | exit 0              |
| Typecheck | `pnpm --filter web check-types`               | exit 0, no errors   |
| Lint      | `pnpm --filter web lint`                       | exit 0              |

Note: `check-types` runs `next typegen && tsc --noEmit`. There is no test runner
in this repo — do not attempt `pnpm test`.

## Scope

**In scope** (the only files you should modify or create):
- `apps/web/package.json` (add two deps)
- `apps/web/lib/rate-limit.ts` (create)
- `apps/web/lib/auth.ts` (create)
- `apps/web/app/api/ai/generate-form/route.ts`
- `apps/web/app/api/ai/summary/route.ts`
- `apps/web/app/api/ai/followup/route.ts`

**Out of scope** (do NOT touch):
- `apps/api/src/server.ts` — Express rate limiting is handled in plan 002.
- `packages/services/**` — do not modify the shared Redis or token services;
  the web helpers are intentionally separate to avoid the DB-on-import problem.
- Any client/component file that *calls* these routes. The request bodies are
  unchanged; only server-side gating is added. Callers send cookies automatically
  (same-origin fetch), so no client change is needed.
- `apps/web/lib/ai.ts`.

## Git workflow

- Branch: `advisor/001-protect-ai-routes`
- Commit style: one-line conventional-commit messages, no body (matches
  `git log`, e.g. `feat: integrate PostHog for analytics tracking`). The repo
  convention is a single summary line only.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add dependencies

In `apps/web/package.json`, add to `dependencies`:
- `"ioredis": "^5.10.1"` (same major as `apps/api`)
- `"jsonwebtoken": "^9.0.2"`

And to `devDependencies`:
- `"@types/jsonwebtoken": "^9.0.7"`

Then run `pnpm install`.

**Verify**: `pnpm install` → exit 0; `node -e "require('ioredis');require('jsonwebtoken')" ` is not needed (ESM), instead confirm `pnpm --filter web exec node -e "import('ioredis').then(()=>console.log('ok'))"` prints `ok`.

### Step 2: Create the Redis rate-limit helper

Create `apps/web/lib/rate-limit.ts` mirroring the existing primitive. Use a
module-singleton Redis client (Next.js may re-import in dev — guard with
`globalThis`):

```ts
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { __aiRedis?: Redis };

const redis =
  globalForRedis.__aiRedis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });
if (process.env.NODE_ENV !== "production") globalForRedis.__aiRedis = redis;

/**
 * Fixed-window rate limit. Mirrors packages/services/redis/index.ts:rateLimit.
 * Fails OPEN (allowed) if Redis is unreachable so the app degrades gracefully.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
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
```

**Verify**: `pnpm --filter web check-types` → exit 0.

### Step 3: Create the auth helper

Create `apps/web/lib/auth.ts`. It reads the `access_token` cookie via
`next/headers` and verifies it with the **same secret** the API uses. Returns
`userId` or `null`.

```ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Verifies the access_token cookie using JWT_ACCESS_SECRET (same secret the
 * API issues with). Returns the userId, or null if absent/invalid/expired.
 */
export async function getUserIdFromCookies(): Promise<string | null> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "object" && payload && typeof payload.userId === "string") {
      return payload.userId;
    }
    return null;
  } catch {
    return null;
  }
}
```

Note: `cookies()` is async in this Next.js version — `await` it. Confirm by
checking that other server code in `apps/web` awaits `cookies()`; if it does not
and uses it synchronously, match the repo's actual call form instead (this is a
STOP-worthy ambiguity only if `pnpm --filter web check-types` errors on it).

**Verify**: `pnpm --filter web check-types` → exit 0.

### Step 4: Gate `generate-form` (auth + rate limit)

In `apps/web/app/api/ai/generate-form/route.ts`, at the very start of `POST`,
before `req.json()`:

```ts
import { getUserIdFromCookies } from "~/lib/auth";
import { rateLimit } from "~/lib/rate-limit";
// ... existing imports ...

export async function POST(req: Request) {
  const userId = await getUserIdFromCookies();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { allowed } = await rateLimit(`ai:generate-form:${userId}`, 20, 3600);
  if (!allowed) return new Response("Rate limited", { status: 429 });

  // ... existing body parsing + generateObject logic unchanged ...
}
```

(20 generations per hour per user.)

**Verify**: `pnpm --filter web check-types` → exit 0.

### Step 5: Gate `summary` (auth + rate limit)

Same pattern in `apps/web/app/api/ai/summary/route.ts`:

```ts
const userId = await getUserIdFromCookies();
if (!userId) return new Response("Unauthorized", { status: 401 });
const { allowed } = await rateLimit(`ai:summary:${userId}`, 30, 3600);
if (!allowed) return new Response("Rate limited", { status: 429 });
```

Insert before the existing `req.json()` call.

**Verify**: `pnpm --filter web check-types` → exit 0.

### Step 6: Rate-limit `followup` (IP only — keep public)

In `apps/web/app/api/ai/followup/route.ts`, do **not** add auth. Add per-IP
limiting before `req.json()`:

```ts
import { rateLimit, clientIp } from "~/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed } = await rateLimit(`ai:followup:${ip}`, 30, 60);
  if (!allowed) return new Response("Rate limited", { status: 429 });

  // ... existing logic unchanged ...
}
```

(30 follow-ups per minute per IP — generous for a single respondent, caps abuse.)

**Verify**: `pnpm --filter web check-types` → exit 0 and `pnpm --filter web lint` → exit 0.

## Test plan

There is no test runner in this repo, so verification is manual + typecheck/lint.

Manual smoke (only if a dev server + Redis are available; if not, skip and rely
on typecheck/lint, and note it in your report):
1. Start: `pnpm dev` (needs Postgres + Redis running per README).
2. `curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/ai/generate-form -H 'content-type: application/json' -d '{"prompt":"event feedback"}'`
   → expect `401` (no cookie).
3. `curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/ai/followup -H 'content-type: application/json' -d '{"question":"q","answer":"a"}'`
   → expect `200` first time (public), `429` after >30 calls within 60s.

## Done criteria

ALL must hold:

- [ ] `pnpm --filter web check-types` exits 0
- [ ] `pnpm --filter web lint` exits 0
- [ ] `apps/web/lib/rate-limit.ts` and `apps/web/lib/auth.ts` exist
- [ ] `grep -n "getUserIdFromCookies" apps/web/app/api/ai/generate-form/route.ts apps/web/app/api/ai/summary/route.ts` → both files match
- [ ] `grep -L "getUserIdFromCookies" apps/web/app/api/ai/followup/route.ts` → followup is NOT auth-gated (still public)
- [ ] `grep -n "rateLimit" apps/web/app/api/ai/followup/route.ts` → followup IS rate-limited
- [ ] `git status --porcelain` shows no files modified outside the in-scope list
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Any in-scope route file's current code doesn't match the excerpts here (drift).
- `cookies()` usage causes a typecheck error you can't resolve by toggling
  `await` — report the Next.js version's actual contract instead of guessing.
- `JWT_ACCESS_SECRET` or `REDIS_URL` turn out **not** to be available in the web
  runtime (e.g. typecheck passes but a smoke test shows 401 for a known-good
  logged-in cookie). Report rather than weakening the check.
- The fix appears to require editing `packages/services/**` or `apps/api/**`.

## Maintenance notes

- If the AI provider in `apps/web/lib/ai.ts` is swapped (the comments reference
  Anthropic/Claude), these gates are provider-agnostic and need no change.
- The two web-local helpers intentionally duplicate ~10 lines of the shared
  services. If `@repo/services` is ever refactored to lazy-init the DB, consider
  consolidating onto it. Until then, keep them separate.
- Reviewer should confirm: (1) followup stays unauthenticated, (2) the rate-limit
  helper fails *open* (a Redis outage must not break public form fills), (3) the
  limits chosen are sane for the deployment's expected traffic.
- Limits are per-user / per-IP fixed-window. If a global budget cap is later
  desired, add an additional `ai:global:*` counter — deferred out of this plan.

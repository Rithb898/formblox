# Plan 003: Harden the public `saveFollowups` mutation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat da38d0e..HEAD -- packages/trpc/server/routes/forms/public.ts packages/trpc/server/routes/forms/model.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness / security
- **Planned at**: commit `da38d0e`, 2026-06-12

## Why this matters

`saveFollowups` is a **public** (unauthenticated) tRPC mutation. Today it accepts
any `responseId` (UUID) plus an **unbounded** array of free-text follow-up
records, verifies only that the response row exists, then bulk-inserts every item
into `ai_followups`. There is **no rate limit, no array-size cap, no string-length
cap, and no recency check**. A caller who learns or guesses a response UUID can
append unlimited arbitrary rows to that response — a cheap storage-exhaustion /
data-pollution vector, and rows pollute the creator's analytics. After this plan:
the array and each string are bounded by the input schema, the call is rate-limited
per IP, and follow-ups can only be appended to a *recently active* response
(closing the "append to any old response forever" hole).

## Current state

`packages/trpc/server/routes/forms/public.ts` — the `saveFollowups` procedure
(bottom of the `formsPublicRouter`):

```ts
saveFollowups: publicProcedure
  .meta({
    openapi: { method: "POST", path: "/public/responses/{responseId}/followups", tags: TAGS },
  })
  .input(
    z.object({
      responseId: z.string().uuid(),
      followups: z.array(followupInputSchema),
    }),
  )
  .output(z.void())
  .mutation(async ({ input }) => {
    if (input.followups.length === 0) return;

    // Verify the response exists before writing; fetch formId for cache invalidation
    const [response] = await db
      .select({ id: responsesTable.id, formId: formVersionsTable.formId })
      .from(responsesTable)
      .innerJoin(formVersionsTable, eq(formVersionsTable.id, responsesTable.formVersionId))
      .where(eq(responsesTable.id, input.responseId))
      .limit(1);
    if (!response) throw new TRPCError({ code: "NOT_FOUND" });

    await db.insert(aiFollowupsTable).values(
      input.followups.map((f) => ({
        responseId: input.responseId,
        fieldId: f.fieldId,
        aiQuestion: f.aiQuestion,
        userAnswer: f.userAnswer ?? null,
      })),
    );

    await invalidateKeys(CacheKeys.formResponses(response.formId));
  }),
```

Note `.mutation(async ({ input }) => ...)` — it does **not** currently destructure
`ctx`; you'll add `ctx` to reach `ctx.ip`.

Supporting facts:
- The input schema reuses `followupInputSchema` from
  `packages/trpc/server/routes/forms/model.ts:107`:
  ```ts
  export const followupInputSchema = z.object({
    fieldId: z.string().describe("Field nanoid that triggered the follow-up"),
    aiQuestion: z.string().describe("The AI-generated follow-up question"),
    userAnswer: z.string().nullable().describe("User's reply, or null if skipped"),
  });
  ```
  `aiQuestion` and `userAnswer` are currently **unbounded** strings.
- `responsesTable` (`packages/database/models/responses.ts`) has
  `completedAt` (nullable timestamp) and `lastActivityAt` (notNull, defaults now).
  Use `completedAt` for the recency gate (a follow-up is saved right after a
  response is completed by the `submit` flow).
- Rate-limit primitive and its established usage — `submit` in the same file:
  ```ts
  import { rateLimit } from "@repo/services/redis";   // already imported in this file
  const ip = ctx.ip ?? "unknown";
  const { allowed } = await rateLimit(`responses:submit:${ip}:${input.slug}`, 10, 60);
  if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });
  ```
  `rateLimit` is **already imported** at the top of `public.ts` — confirm with
  `grep -n "rateLimit" packages/trpc/server/routes/forms/public.ts`.

### Conventions to follow

Match the existing `submit` handler's style for rate limiting and `TRPCError`
codes (`TOO_MANY_REQUESTS` with `message: "rate_limited"`). Keep the existing
cache invalidation. Do not change the OpenAPI path or output shape.

## Commands you will need

| Purpose   | Command (run from repo root)            | Expected on success |
|-----------|-----------------------------------------|---------------------|
| Install   | `pnpm install`                          | exit 0              |
| Typecheck | `pnpm --filter @repo/trpc check-types`  | exit 0 (or use build if no such script) |
| Lint      | `pnpm --filter @repo/trpc lint`         | exit 0              |

If `@repo/trpc` has no `check-types`/`lint` script, fall back to the repo-wide
`pnpm check-types` and `pnpm lint` and note it. There is no test runner — do not
attempt `pnpm test`.

## Scope

**In scope** (only files you should modify):
- `packages/trpc/server/routes/forms/public.ts` (`saveFollowups` only)
- `packages/trpc/server/routes/forms/model.ts` (add bounds to
  `followupInputSchema` — but see Step 1 caution)

**Out of scope** (do NOT touch):
- The `submit` mutation and any other procedure in `public.ts`.
- `packages/database/**` — no schema/migration change; the DB columns are `text`
  and already accommodate bounded input.
- `apps/web/**` — the client already sends short AI-generated strings; bounding
  the server input does not require a client change (the strings are well under
  the caps below).

## Git workflow

- Branch: `advisor/003-harden-savefollowups`
- Commit style: one-line conventional-commit message, no body (matches `git log`,
  e.g. `feat: add output schema for setVisibility, softDelete, and restore mutations`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Bound the follow-up payload at the schema

`followupInputSchema` is shared (also used by `submit`'s `followups` and by
`responses.ts` reads). Adding **length caps** to the string fields is safe for all
consumers because the AI follow-up strings are short by construction
(`apps/web/app/api/ai/followup/route.ts` caps generation at `maxOutputTokens: 100`).

In `packages/trpc/server/routes/forms/model.ts`, update `followupInputSchema`:

```ts
export const followupInputSchema = z.object({
  fieldId: z.string().max(64).describe("Field nanoid that triggered the follow-up"),
  aiQuestion: z.string().max(2000).describe("The AI-generated follow-up question"),
  userAnswer: z.string().max(10000).nullable().describe("User's reply, or null if skipped"),
});
```

**Caution**: if `followupInputSchema` is referenced by an `.output(...)` schema
anywhere (not just `.input(...)`), tightening it could reject existing stored data
on read. Check first:
```
grep -rn "followupInputSchema" packages/trpc
```
If it appears inside any `.output(` chain, **STOP** and report — apply bounds via
a separate input-only schema instead.

**Verify**: typecheck gate → exit 0.

### Step 2: Cap the array size on the `saveFollowups` input

In `public.ts`, change the `saveFollowups` input from
`followups: z.array(followupInputSchema)` to:

```ts
followups: z.array(followupInputSchema).min(1).max(50),
```

(A single response cannot plausibly have more than a handful of AI follow-ups;
50 is a generous ceiling. `.min(1)` lets the existing `length === 0` early-return
stay as defense-in-depth, but the schema now rejects empties up front — keep the
early return too.)

**Verify**: typecheck gate → exit 0.

### Step 3: Rate-limit per IP and add a recency gate

Rewrite the `saveFollowups` `.mutation` body to (a) destructure `ctx`,
(b) rate-limit per IP, (c) select `completedAt` and reject responses older than
a short window:

```ts
.mutation(async ({ ctx, input }) => {
  if (input.followups.length === 0) return;

  const ip = ctx.ip ?? "unknown";
  const { allowed } = await rateLimit(`responses:followups:${ip}`, 30, 60);
  if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });

  // Verify the response exists; fetch formId (cache) and completedAt (recency).
  const [response] = await db
    .select({
      id: responsesTable.id,
      formId: formVersionsTable.formId,
      completedAt: responsesTable.completedAt,
    })
    .from(responsesTable)
    .innerJoin(formVersionsTable, eq(formVersionsTable.id, responsesTable.formVersionId))
    .where(eq(responsesTable.id, input.responseId))
    .limit(1);
  if (!response) throw new TRPCError({ code: "NOT_FOUND" });

  // Follow-ups are saved immediately after submission. Reject appends to
  // responses completed more than an hour ago to close the "append forever" hole.
  const completedAt = response.completedAt;
  if (!completedAt || Date.now() - completedAt.getTime() > 60 * 60 * 1000) {
    throw new TRPCError({ code: "FORBIDDEN", message: "response_closed" });
  }

  await db.insert(aiFollowupsTable).values(
    input.followups.map((f) => ({
      responseId: input.responseId,
      fieldId: f.fieldId,
      aiQuestion: f.aiQuestion,
      userAnswer: f.userAnswer ?? null,
    })),
  );

  await invalidateKeys(CacheKeys.formResponses(response.formId));
}),
```

**Verify**: typecheck and lint gates → exit 0.

### Step 4: Confirm the real client flow still fits the window

Check that the web client saves follow-ups promptly after submit (so the 1-hour
window can't break a legitimate flow). Inspect
`apps/web/app/f/[slug]/_components/form-runner.tsx` for where it calls the
`saveFollowups` mutation relative to submission. If follow-ups can legitimately be
saved more than an hour after `completedAt`, **STOP** and report — widen or remove
the recency gate rather than breaking the flow. (You are not editing this file;
it is read-only verification.)

**Verify**: reading only — confirm the call happens in the same submission flow.

## Test plan

No test runner exists; verify by typecheck + lint + optional manual check.

Manual (only if API + Redis + DB are runnable):
1. Submit a public form to obtain a fresh `responseId` (response of `submit`).
2. `POST /api/public/responses/{responseId}/followups` with a 1-item array →
   expect success (`204`/void).
3. Repeat with `responseId = <random UUID>` → expect `404`.
4. Send `followups` array of length 51 → expect `400` (schema rejects).
5. Hammer >30 calls within 60s from one IP → expect `429` (`rate_limited`).

If you cannot run the stack, rely on typecheck/lint and say so.

## Done criteria

ALL must hold:

- [ ] Typecheck gate exits 0
- [ ] Lint gate exits 0
- [ ] `grep -n "responses:followups:" packages/trpc/server/routes/forms/public.ts` → matches (rate limit added)
- [ ] `grep -n "response_closed" packages/trpc/server/routes/forms/public.ts` → matches (recency gate added)
- [ ] `grep -n ".max(50)" packages/trpc/server/routes/forms/public.ts` → matches (array cap)
- [ ] `git status --porcelain` shows only the two in-scope files modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `followupInputSchema` is used in any `.output(...)` chain (Step 1 caution).
- The web client (`form-runner.tsx`) can save follow-ups >1 hour after a response
  is completed (Step 4) — the recency gate would break a real flow.
- The current `saveFollowups` code doesn't match the excerpt (drift).
- `rateLimit` is not already imported in `public.ts` and importing it from
  `@repo/services/redis` causes a typecheck error.

## Maintenance notes

- The recency gate assumes follow-ups are always saved right after submission. If
  a "resume / edit my response later" feature is added, this 1-hour window must be
  revisited (likely replaced with a signed response token check).
- The per-IP rate-limit key (`responses:followups:${ip}`) is global per IP, not
  per-response. That's intentional (the abuse vector is volume, not per-response
  fairness). Reviewer should confirm that's acceptable for shared-NAT respondents.
- A stronger fix (out of scope here) would bind follow-up writes to the
  `responseToken` issued at submission rather than the response UUID, removing
  UUID-guessability entirely. Deferred — it requires a client change to thread the
  token through.

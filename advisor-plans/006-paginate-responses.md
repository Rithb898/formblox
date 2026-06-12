# Plan 006: Paginate the responses list (API + dashboard)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat da38d0e..HEAD -- packages/trpc/server/routes/forms/responses.ts packages/trpc/server/routes/forms/model.ts packages/services/redis/cache-keys.ts "apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx"`
> The working tree has intentional uncommitted hardening in `model.ts`
> (max-length constraints on `followupInputSchema`) — that is EXPECTED, not
> drift. If `responses.ts`, `cache-keys.ts`, or the responses page changed,
> compare the "Current state" excerpts before proceeding; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (output-shape change on one endpoint; cache key versioning required)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `da38d0e`, 2026-06-12 (plus intentional uncommitted hardening in the working tree)

## Why this matters

`forms.responses.list` fetches **every** completed response for a form — plus
every answer row and every AI follow-up for all of them — in one shot, with no
limit, then serializes the whole thing to the dashboard, which renders the
full list. A form with a few thousand responses means multi-MB payloads,
slow queries, and an unusable responses page. The product spec also lists
"response filtering and pagination" as an expected capability. This plan adds
offset pagination to the API and a "Load more" flow to the dashboard.

## Current state

- `packages/trpc/server/routes/forms/responses.ts` — the `list` procedure
  (lines ~130–217). Shape today:

```ts
// responses.ts:130-152 (abridged)
list: formProcedure
  .meta({ openapi: { method: "GET", path: "/forms/{formId}/responses", tags: TAGS } })
  .input(z.object({ formId: z.string() }))
  .output(responseListSchema)
  .query(async ({ ctx }) => {
    return withCache(CacheKeys.formResponses(ctx.form.id), 120, async () => {
      const versions = await db.select({ id: formVersionsTable.id })... // all versions of form
      const responses = await db
        .select({ id: responsesTable.id, completedAt: responsesTable.completedAt })
        .from(responsesTable)
        .where(and(inArray(responsesTable.formVersionId, versionIds), isNotNull(responsesTable.completedAt)))
        .orderBy(desc(responsesTable.completedAt));      // ← NO LIMIT
      // then batch-fetches answers + followups for ALL responseIds via inArray
      // and assembles responseListSchema items
```

  The per-response batching (answers, followups via `inArray`) is good — keep
  it; only the outer response set needs bounding.

- `packages/trpc/server/routes/forms/model.ts` — output schemas:

```ts
// model.ts:100-106
export const responseListItemSchema = z.object({
  id: z.string().describe("Response UUID"),
  completedAt: z.date().nullable().describe("When the response was submitted"),
  answers: z.array(responseAnswerSchema).describe("Answers ordered by field order"),
});
export const responseListSchema = z.array(responseListItemSchema);
```

- Cache: `packages/services/redis/cache-keys.ts:6` —
  `formResponses: (formId: string) => `form:responses:${formId}``.
  Invalidated (exact key) at `public.ts:199` (on submit) and `public.ts:292`
  (on saveFollowups). **Exact-key invalidation is why deeper pages must not be
  cached** — there is no pattern-delete helper.

- UI: `apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx`
  ("use client", 286 lines). Master-detail layout: left panel lists responses,
  right panel shows the selected one.

```ts
// page.tsx:21-37 (abridged)
const q = trpc.forms.responses.list.useQuery({ formId });
...
const responses = q.data ?? [];
const count = responses.length;
const selected = responses.find((r) => r.id === selectedId) ?? responses[0] ?? null;
```

  `count` is also rendered as a header badge (page.tsx:54-58). Columns are
  derived by iterating `q.data` (page.tsx:24-33).

- The sibling `summaryData` query in the same file is ALSO unbounded but is
  out of scope here (it feeds the AI summary, which wants the full dataset —
  see Maintenance notes).

- tRPC client setup is standard `@trpc/react-query` v11 — `useInfiniteQuery`
  is available on procedures whose input contains an optional `cursor`.

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Typecheck | `pnpm check-types` | exit 0              |
| Lint      | `pnpm lint`        | exit 0              |
| Dev (manual check) | `pnpm dev` | web :3000, api :8123 (needs root `.env`) |
| Seed data | `pnpm db:seed`     | seeds demo forms + responses |

## Scope

**In scope** (the only files you should modify):
- `packages/trpc/server/routes/forms/responses.ts`
- `packages/trpc/server/routes/forms/model.ts`
- `packages/services/redis/cache-keys.ts`
- `apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx`

**Out of scope** (do NOT touch):
- `summaryData` in `responses.ts` — intentionally still unbounded (AI summary
  consumes the full set; bounding it changes product behavior).
- `public.ts` — its two `invalidateKeys(CacheKeys.formResponses(...))` call
  sites keep working untouched because the key function itself is versioned.
- Response export/CSV — does not exist; do not invent it here.
- Any other consumer of `responseListSchema` (check with grep in Step 1).

## Git workflow

- Branch: `advisor/006-paginate-responses`.
- Commit message: single line, e.g. `feat: paginate responses list with load-more`.
  No body, no Co-Authored-By trailer (operator preference).
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Confirm the blast radius

Run: `grep -rn "responses.list\|responseListSchema" apps/web packages/trpc --include='*.ts*' | grep -v node_modules`

**Verify**: the only UI consumer of `responses.list` is the responses page,
and `responseListSchema` is referenced only in `model.ts` + `responses.ts`.
If other consumers exist, STOP and report them.

### Step 2: Add the paged output schema

In `model.ts`, below `responseListSchema`, add:

```ts
export const responseListPageSchema = z.object({
  items: z.array(responseListItemSchema),
  total: z.number().int().describe("Total completed responses for the form"),
  nextCursor: z.number().int().nullable().describe("Offset of the next page, or null"),
});
```

Keep `responseListSchema` exported (it stays the item-array shape used inside
the page schema).

**Verify**: `pnpm check-types` (will fail only if you broke syntax — the new
schema is not yet consumed).

### Step 3: Version the cache key

In `cache-keys.ts`, change the `formResponses` entry to:

```ts
formResponses: (formId: string) => `form:responses:v2:${formId}`,
```

Why: the cached value's shape changes from an array to `{items, total,
nextCursor}`. Versioning the key prevents 120s of stale old-shape payloads
failing output validation after deploy. Old `form:responses:*` keys expire on
their own TTL. Because both invalidation call sites in `public.ts` go through
this same function, they keep working with zero changes.

**Verify**: `grep -rn "form:responses" packages/ | grep -v node_modules` → only
the v2 definition.

### Step 4: Paginate the procedure

In `responses.ts`, modify `list`:

1. Input: `z.object({ formId: z.string(), limit: z.number().int().min(1).max(100).optional(), cursor: z.number().int().min(0).optional() })`
   (`cursor` is the row offset; naming it `cursor` is what enables
   `useInfiniteQuery` on the client).
2. Output: `responseListPageSchema` (import it).
3. In the handler: `const limit = input.limit ?? 50; const offset = input.cursor ?? 0;`
4. Add a total count query (after resolving `versionIds`):

```ts
const [{ value: total }] = await db
  .select({ value: count() })
  .from(responsesTable)
  .where(and(inArray(responsesTable.formVersionId, versionIds), isNotNull(responsesTable.completedAt)));
```

   (`count` comes from `@repo/database` / drizzle — check how `public.ts` or
   `listPublic` imports `count` and match it.)
5. Append `.limit(limit).offset(offset)` to the existing responses query.
   Keep the `orderBy(desc(responsesTable.completedAt))`.
6. Return `{ items, total, nextCursor: offset + items.length < total ? offset + items.length : null }`
   where `items` is the array the procedure currently returns.
7. Cache ONLY the first page (exact-key invalidation can't clear per-page
   keys):

```ts
const loader = async () => { /* existing body, now paginated */ };
if (offset === 0 && limit === 50) {
  return withCache(CacheKeys.formResponses(ctx.form.id), 120, loader);
}
return loader();
```

8. OpenAPI: the GET meta can stay; `trpc-to-openapi` maps optional
   primitives to query params. If typecheck or the OpenAPI generator rejects
   number query params, STOP (see STOP conditions) rather than switching the
   route to POST.

**Verify**: `pnpm check-types` → exit 0.

### Step 5: Convert the page to infinite query

In `apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx`:

1. Replace the query:

```ts
const q = trpc.forms.responses.list.useInfiniteQuery(
  { formId },
  { getNextPageParam: (last) => last.nextCursor },
);
const responses = q.data?.pages.flatMap((p) => p.items) ?? [];
const count = q.data?.pages[0]?.total ?? 0;
```

2. The rest of the component reads `responses` exactly as before (columns
   derivation, `selected`, the list panel). Update the two places that read
   `q.data` directly (column derivation loop at ~page.tsx:26 and the
   `responses` assignment) to use the flattened array.
3. At the bottom of the left list panel, when `q.hasNextPage`, render a
   "Load more" button calling `q.fetchNextPage()`, disabled while
   `q.isFetchingNextPage`. Match the page's visual idiom — e.g. a full-width
   ghost button: `className="w-full rounded-xl p-3 font-mono text-[11px] text-[#6B6B6B] ring-1 ring-white/[0.06] transition-colors hover:text-[#F2F2F2]"`.
   Use the existing `Loader2` spinner pattern from the forms page if you add
   a pending state.
4. The header badge now shows `total` (true count), which is an improvement —
   previously it showed only loaded rows.

**Verify**: `pnpm check-types && pnpm lint` → both exit 0.

### Step 6: Manual check (if root `.env` present)

`pnpm db:seed` (demo data includes seeded responses), `pnpm dev`, open a
seeded form's responses page.

**Verify**: page renders; badge shows total; if total > 50 a Load more button
appears and appends rows without resetting selection. Submit a new response
via the public form; within one refetch the new response appears (cache key
invalidation works). If env/services unavailable, skip and note it.

## Test plan

No test infrastructure exists (known, deferred). Gates: typecheck, lint,
Step 6 manual pass. First regression tests when a baseline lands: `list`
returns `total` independent of `limit`; `nextCursor` is null on the last
page; first-page cache is invalidated by a new submission.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "limit(limit).offset(offset)\|\.limit(limit)" packages/trpc/server/routes/forms/responses.ts` → ≥1 match
- [ ] `grep -c "form:responses:v2" packages/services/redis/cache-keys.ts` → 1
- [ ] `grep -c "useInfiniteQuery" "apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx"` → 1
- [ ] `pnpm check-types` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `git status` shows changes only to the four in-scope files
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 reveals additional consumers of `responses.list` or
  `responseListSchema`.
- `trpc-to-openapi` rejects the numeric optional query params at typecheck or
  startup — report the exact error; do not change shared OpenAPI plumbing.
- `useInfiniteQuery` is unavailable on the procedure (would mean the tRPC
  client setup is non-standard) — report instead of restructuring the client.
- The responses page no longer matches the excerpt (refactored since planning).

## Maintenance notes

- `summaryData` (same file) is still unbounded by design — when response
  volume grows, it needs its own strategy (sample N most recent + tell the AI
  prompt it's a sample). Deferred deliberately.
- The REST mirror (`GET /forms/{formId}/responses`) gains `limit`/`cursor`
  query params; API-docs users get backward-incompatible output (`{items,...}`
  instead of a bare array). This is pre-1.0 and unannounced — acceptable, but
  the reviewer should know.
- If response *filtering* is added later (the spec mentions it), it slots into
  the same input object and the cache-only-first-page rule must extend to
  "only cache the unfiltered first page".

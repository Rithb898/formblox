# Plan 005: Let creators close/reopen a form for responses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat da38d0e..HEAD -- packages/trpc/server/routes/forms/ "apps/web/app/(dashboard)/forms/page.tsx"`
> The working tree already contains intentional uncommitted hardening changes
> to `packages/trpc/server/routes/forms/public.ts` and `model.ts` — that is
> EXPECTED, not drift. If `crud.ts`, `route.ts`, or the forms page changed,
> compare the "Current state" excerpts below against the live code; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / direction
- **Planned at**: commit `da38d0e`, 2026-06-12 (plus intentional uncommitted hardening in the working tree)

## Why this matters

The product spec (hackathon.md, a scored rubric) requires creators to
"create, edit, publish, **unpublish**, and manage forms". The data model and
the public runtime already support closing a form: `formsTable.isAcceptingResponses`
exists, the public `getBySlug` and `submit` procedures both reject when it is
`false` (with `FORBIDDEN not_accepting_responses`), and the dashboard list
even selects the column. But **no mutation anywhere writes it** — a creator
who publishes a form can never close it. This plan adds the missing
`setAcceptingResponses` mutation, a dashboard toggle, and fixes a cache-
invalidation omission in the adjacent `setVisibility` mutation while in the
same file.

## Current state

- `packages/trpc/server/routes/forms/crud.ts` — form CRUD procedures. Contains
  `setVisibility` (the closest exemplar — copy its shape):

```ts
// crud.ts:78-91 (working tree)
export const setVisibility = formProcedure
  .meta({ openapi: { method: "PATCH", path: "/forms/{formId}/visibility", tags: TAGS } })
  .input(z.object({ formId: z.string(), visibility: z.enum(["public", "unlisted"]) }))
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    await db
      .update(formsTable)
      .set({ visibility: input.visibility })
      .where(eq(formsTable.id, ctx.form.id));
    await invalidateKeys(
      CacheKeys.formsPublicList(),
      CacheKeys.workspaceForms(ctx.form.workspaceId),
    );
  });
```

  Note `setVisibility` does NOT invalidate `CacheKeys.formSlug(...)` — an
  omission (compare `softDelete` at crud.ts:93-107, which does). Today the
  impact is nil because the cached `getBySlug` payload doesn't expose
  visibility, but for `isAcceptingResponses` the same omission WOULD be a real
  bug: `getBySlug` caches for 1800s and both returns and gates on that flag
  (`public.ts:93-94` throws `FORBIDDEN not_accepting_responses` inside the
  cached loader). The new mutation MUST invalidate `formSlug`.

- `formProcedure` (defined in `packages/trpc/server/trpc.ts`) resolves
  `ctx.form` (with `id`, `workspaceId`, `publicSlug`) and enforces ownership.
  You do not need to add any auth logic.

- `packages/trpc/server/routes/forms/route.ts` — router registration:

```ts
// route.ts:8-13
create: crud.create,
list: crud.list,
get: crud.get,
softDelete: crud.softDelete,
restore: crud.restore,
setVisibility: crud.setVisibility,
```

- Cache keys: `packages/services/redis/cache-keys.ts` —
  `formSlug(slug)`, `formsPublicList()`, `workspaceForms(workspaceId)`.

- Public enforcement (do NOT change, it already works — `public.ts:93-94` and
  `public.ts:154-155`):

```ts
if (!form.isAcceptingResponses)
  throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });
```

- Dashboard UI: `apps/web/app/(dashboard)/forms/page.tsx` ("use client").
  `FormListItem` type already carries `isAcceptingResponses: boolean`
  (page.tsx:47-54). Cards render `QuickAction` buttons (Edit / Responses /
  Copy link / Delete) in a hover overlay (~page.tsx:225-250). Mutation
  exemplar to copy (page.tsx:469-476):

```ts
const deleteMutation = trpc.forms.softDelete.useMutation({
  onSuccess: () => {
    formsQuery.refetch();
    setDeleteTarget(null);
    toast.success("Form deleted");
  },
  onError: () => toast.error("Failed to delete form"),
});
```

  Icons come from `lucide-react`; toasts from `sonner` (already imported).

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Typecheck | `pnpm check-types` | exit 0              |
| Lint      | `pnpm lint`        | exit 0              |
| Dev (manual check) | `pnpm dev` | web on :3000, api on :8123 (needs root `.env`) |

## Scope

**In scope** (the only files you should modify):
- `packages/trpc/server/routes/forms/crud.ts`
- `packages/trpc/server/routes/forms/route.ts`
- `apps/web/app/(dashboard)/forms/page.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `packages/trpc/server/routes/forms/public.ts` — enforcement already exists;
  it also contains fresh uncommitted security hardening you must not disturb.
- `packages/trpc/server/routes/forms/versions.ts` (publish flow) — a true
  "unpublish" (archiving the published version) is explicitly deferred; see
  Maintenance notes.
- `packages/database/*` — no schema change needed; the column exists.
- The public form page `apps/web/app/f/[slug]/` — it already handles the
  `not_accepting_responses` error state.

## Git workflow

- Branch: `advisor/005-close-form-toggle`.
- Commit message: single line, e.g. `feat: add close/reopen responses toggle for forms`.
  No body, no Co-Authored-By trailer (operator preference).
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Add the mutation to crud.ts

Below `setVisibility`, add:

```ts
export const setAcceptingResponses = formProcedure
  .meta({
    openapi: { method: "PATCH", path: "/forms/{formId}/accepting-responses", tags: TAGS },
  })
  .input(z.object({ formId: z.string(), isAcceptingResponses: z.boolean() }))
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    await db
      .update(formsTable)
      .set({ isAcceptingResponses: input.isAcceptingResponses })
      .where(eq(formsTable.id, ctx.form.id));
    await invalidateKeys(
      CacheKeys.formSlug(ctx.form.publicSlug),
      CacheKeys.formsPublicList(),
      CacheKeys.workspaceForms(ctx.form.workspaceId),
    );
  });
```

`formSlug` invalidation is load-bearing: `getBySlug` caches for 1800s and the
flag gates submission UX inside that cached payload.

**Verify**: `pnpm check-types` → exit 0.

### Step 2: Fix the setVisibility invalidation omission

In the existing `setVisibility` mutation, add
`CacheKeys.formSlug(ctx.form.publicSlug),` as the first argument of its
`invalidateKeys(...)` call (matching `softDelete`'s pattern).

**Verify**: `grep -A4 "invalidateKeys" packages/trpc/server/routes/forms/crud.ts | grep -c formSlug` → `2` (setVisibility + softDelete).

### Step 3: Register the procedure

In `packages/trpc/server/routes/forms/route.ts`, add
`setAcceptingResponses: crud.setAcceptingResponses,` next to
`setVisibility: crud.setVisibility,`.

**Verify**: `pnpm check-types` → exit 0.

### Step 4: Add the dashboard toggle

In `apps/web/app/(dashboard)/forms/page.tsx`:

1. Add a mutation alongside `deleteMutation` (same component), modeled on it:

```ts
const acceptingMutation = trpc.forms.setAcceptingResponses.useMutation({
  onSuccess: (_d, vars) => {
    formsQuery.refetch();
    toast.success(vars.isAcceptingResponses ? "Form reopened" : "Form closed to responses");
  },
  onError: () => toast.error("Failed to update form"),
});
```

2. Add a `QuickAction` to the card's hover-action row (next to Delete),
   passing the handler down the same way `onDelete` is passed to `FormCard`.
   Use `Lock` / `LockOpen` icons from `lucide-react`. Label: form's
   `isAcceptingResponses` ? "Close responses" : "Reopen responses". The
   handler calls
   `acceptingMutation.mutate({ formId: form.id, isAcceptingResponses: !form.isAcceptingResponses })`.
3. Optional polish (skip if it grows the diff): when
   `!form.isAcceptingResponses`, render a small "closed" indicator near
   `StatusPill` using the existing pill styling (`bg-white/[0.06] text-[#6B6B6B]`).
   Match the file's visual idiom (rounded-full, font-mono, 10px uppercase).

Note: the `forms.list` payload is served from a 180s Redis cache
(`workspaceForms`), but the mutation invalidates that key, so
`formsQuery.refetch()` returns fresh data.

**Verify**: `pnpm check-types && pnpm lint` → both exit 0.

### Step 5: Manual end-to-end check (if root `.env` present)

Run `pnpm dev`. In the dashboard: close a form via the new toggle, then open
its public URL `/f/<slug>` in an incognito tab.

**Verify**: public page shows its "not accepting responses" state immediately
(no 30-minute stale window). Reopen, reload public page — form is fillable.
If `.env`/services are unavailable, skip and note it in your report.

## Test plan

No test infrastructure exists in this repo (known, deferred). Gates are
typecheck + lint + the manual check in Step 5. When a test baseline lands,
the first regression test for this feature: mutation rejects for non-owners
(formProcedure) and `getBySlug` reflects the flag after toggle (cache
invalidation).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "setAcceptingResponses" packages/trpc/server/routes/forms/crud.ts` → ≥1
- [ ] `grep -c "setAcceptingResponses" packages/trpc/server/routes/forms/route.ts` → 1
- [ ] `setVisibility` invalidates `formSlug` (Step 2 grep → 2)
- [ ] `pnpm check-types` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `git status` shows changes only to the three in-scope files
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `crud.ts` no longer contains the `setVisibility` excerpt shown above.
- The forms page no longer has the `QuickAction`/`deleteMutation` structure
  shown above (UI was refactored).
- Typecheck demands changes in `packages/trpc/server/trpc.ts` or the OpenAPI
  layer — the `.meta({ openapi })` shape should Just Work like its siblings;
  if it doesn't, report rather than modifying shared middleware.
- You find an existing mutation that already writes `isAcceptingResponses`
  (the audit found none — finding one means drift).

## Maintenance notes

- True "unpublish" (set the published version back to draft/archived so the
  public link 404s) is deliberately NOT in scope: the publish flow's partial
  unique indexes (`one_draft_per_form`, `one_published_per_form`) make the
  state transition non-trivial, and closing responses covers the user need.
  If unpublish is built later, it belongs in `versions.ts` next to `publish`
  and must invalidate the same three cache keys.
- Reviewer should scrutinize: the cache keys invalidated by the new mutation
  (all three are required), and that the UI toggle stops event propagation
  like its sibling QuickActions (cards navigate on click).

# Slice 2 — Implementation Plan

> Roadmap reference: [vertical-slice-roadmap.md](./vertical-slice-roadmap.md)
> Goal: fill out a published form, submit it, see the answer in the owner's dashboard. FE + BE both working. Submittable.

> **Status (2026-05-25): Implemented.** Backend verified end-to-end via live HTTP submits (valid, missing-required, empty-required, unknown-field, honeypot) — DB rows match design. Frontend typechecks + lints clean but has NOT been exercised in a browser. Not yet committed.

---

## What already exists (scaffolded in Slice 1)

- `responses` + `response_answers` tables, migrated (`0003`). `responses` already has `responseToken` (unique, notNull), `respondentUserId`, `anonymousId`, `startedAt`, `completedAt`, `lastActivityAt`, `metadata`.
- `buildResponseSchema(fields)` + `zodForField` validators for all 8 field types (`packages/forms`).
- Public `forms.public.getBySlug` query.
- `FormRunner` FE stub — renders `short_text`/`long_text`, submission stubbed (`// Slice 2 wires up actual submission`).

## Design decisions (settled)

- **One-shot submit** — single mutation, single transaction, `completedAt = now()`. No partial/resumable flow (deferred to Slice 11).
- **Anonymous respondent** — `respondentUserId` null, `anonymousId` null. Only `formVersionId`, `responseToken`, `completedAt`, + answers written.
- **Trust model** — client sends `slug` + answers; server re-resolves the published version (ignores any client version id) and validates server-side.
- **Storage** — store only answered fields; coerce empty (`""`/null/undefined/`[]`) to absent before validating; one `response_answers` row per remaining answer.
- **List scope** — all responses across all versions of the form; answers' labels resolved from each response's own version.
- **FE** — react-hook-form + `zodResolver`, schema built from shared `buildResponseSchema`; shared `coerceAnswers` helper used both sides.
- **Hardening** — honeypot + `.strict()` schema + Redis fixed-window rate-limit per IP.

---

## Phase 1 — Shared validation helper (`packages/forms`)

### 1.1 `coerceAnswers`

- [x] Added `coerceAnswers(raw)` to `packages/forms` — strips keys whose value is empty/whitespace string, `null`, `undefined`, or `[]`. Exported from `index.ts`. (Dropped the unused `fields` param.)
- [x] `buildResponseSchema` now returns `z.preprocess(coerceAnswers, z.strictObject(shape))` — one schema used identically on client + server; strips empties (so empty-required fails as missing) and rejects unknown fieldIds.

---

## Phase 2 — Backend

### 2.1 tRPC context — client IP

- [x] Widen `Context` (`packages/trpc/server/context.ts`) to carry `ip: string | null` from `req.ip`.
- [x] Ensure the Express app (`apps/api`) sets `trust proxy` so `X-Forwarded-For` resolves the real client IP behind the proxy.

### 2.2 Redis rate-limit helper

- [x] Add a fixed-window helper (`INCR` + `EXPIRE`) in `packages/services/redis` — `rateLimit(key, limit, windowSeconds)` → `{ allowed, remaining }`.

### 2.3 `forms.public.submit` (public.ts)

- [x] Public procedure. Input `{ slug, answers: Record<string, unknown>, _gotcha?: string }`.
- [x] If `_gotcha` non-empty → return fake `{ id }` success, no insert.
- [x] Rate-limit by `ip + slug` (~10/min); over limit → `TOO_MANY_REQUESTS`.
- [x] Re-resolve published version from slug (same checks as `getBySlug`: form exists & not deleted → published version exists → `isAcceptingResponses`), else `NOT_FOUND`/`FORBIDDEN`.
- [x] Load that version's fields; `coerceAnswers` → validate with `buildResponseSchema(fields).strict()`; failure → `BAD_REQUEST`.
- [x] Transaction: insert `responses` (`formVersionId`, `responseToken = nanoid()`, `completedAt = now()`) + one `response_answers` row per answered field.
- [x] Return `{ id }`.

### 2.4 `forms.responses.list` (new responses.ts)

- [x] `formProcedure`. Input `{ formId }`.
- [x] Gather all version ids of the form; fetch responses where `formVersionId IN (...)`, `orderBy(completedAt desc)`.
- [x] For each response, join `response_answers` to that version's `form_fields` → `{ fieldId, label, type, value }`.
- [x] Output schema in `model.ts`: `[{ id, completedAt, answers: [...] }]`.
- [x] Mount router in `route.ts` as `responses: formsResponsesRouter`.

### 2.5 (optional) response count for cards

- [ ] Extend `forms.list` (or a light count query) to include a per-form response count for the dashboard cards. _(Not done — skipped as optional. Responses page shows its own count; form cards link to responses via the dropdown.)_

---

## Phase 3 — Frontend

### 3.1 Runner submission (`apps/web/app/f/[slug]/_components/form-runner.tsx`)

- [x] react-hook-form + `zodResolver(buildResponseSchema(fields))`; register `short_text`/`long_text` inputs.
- [x] Inline per-field error messages; `aria-invalid` + `aria-describedby`.
- [x] On submit: build answers map → `coerceAnswers` → call `forms.public.submit` mutation.
- [x] Submit button shows pending + disabled; prevent double-submit.
- [x] Server error → form-level banner; keep entered values.
- [x] Honeypot `_gotcha` kept and sent.
- [x] Success → existing `ThankYou` state.

### 3.2 Responses dashboard (`apps/web/app/(dashboard)/forms/[formId]/responses/`)

- [x] `page.tsx` — `forms.responses.list` query, loading + empty states.
- [x] Table: one row per response, columns = fields (labels), cells = answer or "—", + `completedAt` column.
- [x] Entry points: "Responses" tab in `editor-topbar.tsx`; link (+ optional count) on each card in `/forms` list page.

---

## Phase 4 — Verify

- [x] Submit → row appears (verified via live HTTP submit; 2 rows in DB, answers + labels correct). Browser walkthrough confirmed 2026-05-25.
- [x] Required-field empty/missing → server `BAD_REQUEST` (verified). FE inline error confirmed in browser (raw Zod message — UX could be improved to "Name is required").
- [x] Unknown field id → strict schema rejects → `BAD_REQUEST` (verified).
- [x] Honeypot filled → fake success (nanoid id), no row (verified).
- [ ] Closed form / unpublished → submit blocked server-side. _(Code mirrors `getBySlug`; not explicitly tested.)_
- [ ] Rate-limit triggers after threshold. _(Helper wired + per-IP key; not load-tested.)_
- [ ] `git commit`, deploy — could submit right now. _(No commit made yet.)_
- [x] Browser walkthrough: fill `/f/:slug` form → ThankYou renders; dashboard responses table shows correct rows, columns, count badge.

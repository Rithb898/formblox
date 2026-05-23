# Slice 1 — Architecture Decisions

> Implementation plan: [slice-1-plan.md](./slice-1-plan.md)

All decisions reached via grilling session on 2026-05-23. Implemented in Slice 1 unless noted.

---

## Data Model

### Tables
| Table | Purpose |
|---|---|
| `workspaces` | Ownership unit; personal workspace auto-created on signup |
| `forms` | Metadata, slug, soft-delete, workspace FK |
| `form_versions` | Respondent-facing snapshot per publish |
| `form_fields` | Fields belonging to a version |
| `responses` | One row per form-fill session (created on first interaction) |
| `response_answers` | One row per field answer |
| `ai_follow_ups` | AI-generated follow-up Q&A (Slice 5) |
| `form_summaries` | Cached AI summaries (Slice 6) |

### `forms`
```
id uuid pk
workspace_id uuid fk → workspaces
public_slug varchar(10) unique         -- nanoid(10), generated at creation
is_accepting_responses boolean default true
deleted_at timestamp nullable          -- soft delete
created_at, updated_at
```

### `form_versions`
```
id uuid pk
form_id uuid fk → forms
version_number int
status pgEnum('draft','published','archived')
title varchar(255)
description text nullable
welcome_screen jsonb nullable
thank_you_screen jsonb nullable
settings jsonb                         -- progress_bar, allow_partial, redirect_url, etc.
theme jsonb nullable                   -- Slice 8
published_at timestamp nullable
created_at, updated_at
```

### `form_fields`
```
id uuid pk
form_version_id uuid fk → form_versions
order int not null
type pgEnum(8 values — see Field Types)
label text not null
required boolean default false
config jsonb                           -- Zod discriminated union per type
created_at, updated_at
```

### `responses`
```
id uuid pk
form_version_id uuid fk → form_versions
respondent_user_id uuid nullable fk → users
anonymous_id varchar nullable          -- cookie value for dedup/resume
response_token varchar unique          -- httpOnly cookie sent to respondent
started_at timestamp default now()
completed_at timestamp nullable        -- null = abandoned/in-progress
last_activity_at timestamp
metadata jsonb                         -- UA, IP hash, UTM, locale
```

### `response_answers`
```
id uuid pk
response_id uuid fk → responses
field_id uuid fk → form_fields
value jsonb
answered_at timestamp
```

### `ai_follow_ups` (Slice 5)
```
id uuid pk
response_id uuid fk → responses
parent_answer_id uuid fk → response_answers
order int
question_text text not null
answer_text text nullable
model varchar
prompt_version varchar
generated_at timestamp
answered_at timestamp nullable
```

### `form_summaries` (Slice 6)
```
id uuid pk
form_id uuid fk → forms
summary jsonb                          -- {themes:[{name,count,examples}], sentiment:{}, key_quotes:[]}
response_count int
model varchar
prompt_version varchar
generated_at timestamp
generated_by uuid fk → users
```

---

## Field Types (pgEnum — all 8 defined from day 1)

`short_text`, `long_text`, `email`, `number`, `single_choice`, `multiple_choice`, `rating`, `date`

**Slice 1 implements:** `short_text`, `long_text`
**Slice 3 adds:** editor + runner UI for remaining 6

### Config shapes (jsonb, validated by Zod discriminated union in `packages/forms/`)
```ts
short_text:      { placeholder?, maxLength?, minLength? }
long_text:       { placeholder?, maxLength?, minLength? }
email:           { placeholder? }
number:          { min?, max?, step?, placeholder? }
single_choice:   { options: {id, label}[], randomize? }
multiple_choice: { options: {id, label}[], min?, max?, randomize? }
rating:          { scale: 5|10, style: 'star'|'number', labels?: {min,max} }
date:            { min?, max?, format? }
```

---

## Versioning Rules

- One `draft` per form at a time (partial unique index)
- One `published` per form at a time (partial unique index)
- Previous `published` → `archived` on new publish

### Publish flow (single DB transaction, row-locked)
1. Validate draft: ≥1 field, all configs valid, non-empty title → reject with `{field_id, error}[]`
2. Flip draft → `published`, set `published_at = now()`
3. Archive previous `published` version
4. Clone all `form_fields` into new `draft` (version_number + 1)
5. Update `forms.updated_at`

---

## Public URL & Access

- `public_slug` = nanoid(10), generated at form creation, never changes
- Public route `/f/:slug` serves latest `published` version
- Pre-publish: branded "not yet live" page
- `is_accepting_responses = false`: "no longer accepting responses" page
- No unpublish action — only `is_accepting_responses` toggle for operational close

---

## Respondents

- Anonymous by default — `respondent_user_id` nullable
- `response_token` httpOnly cookie — created on first answer, resumes same response row
- Response row created on **first interaction**, not on submit
- `completed_at` distinguishes submitted vs abandoned

---

## Validation

- Server builds dynamic Zod schema per `form_version_id` from its fields
- Schema cached in-memory by `version_id` (versions are immutable once published — infinite TTL)
- Same `zodForField(field)` factory used in editor, runner, and server
- Lives in `packages/forms/field-validators.ts`

---

## Auth & Authorization

Layered tRPC procedure ladder:
```
publicProcedure
  authedProcedure          -- requires session, ctx.user
    workspaceProcedure     -- verifies workspace membership, ctx.workspace
      formProcedure        -- verifies form belongs to workspace, ctx.form
        formVersionProcedure  -- verifies version belongs to accessible form, ctx.formVersion
```

Respondent endpoints (`responses.submit.*`, `forms.public.getBySlug`) use `publicProcedure`.

---

## tRPC Router Structure

```
packages/trpc/server/routes/
  auth/                    -- existing
  health/                  -- existing
  workspaces/
    index.ts
  forms/
    index.ts
    crud.ts                -- create, list, get, softDelete, restore
    versions.ts            -- getDraft, updateDraft, publish, listVersions
    public.ts              -- getBySlug (publicProcedure)
  responses/
    index.ts
    submit.ts              -- start, answer, submit
    followup.ts            -- generate, answer         (Slice 5)
    list.ts                -- list responses, get single (authed)
  analytics/
    index.ts
    summary.ts             -- generate, get latest     (Slice 6)
    metrics.ts             -- drop-off, completion     (Slice 10)
```

---

## Code Organization

### New `packages/forms/` (domain package)
```
packages/forms/
  field-types.ts           -- FieldType enum, union
  field-configs.ts         -- Zod discriminated union for config jsonb
  field-validators.ts      -- zodForField(field) factory
  response-builder.ts      -- buildResponseSchema(fields)
  index.ts
```

---

## Editor Frontend

- **State:** Single Zustand store — `{ formVersion, fields, selectedFieldId, dirty, lastSavedAt }`
- **Save:** Explicit (`Cmd+S`), one upsert mutation — full draft state, server diffs + writes in transaction
- **Layout:** 3-pane — field palette / dnd-kit sortable canvas / property panel
- **DnD:** `@dnd-kit/sortable`
- **Property panels:** Hand-coded component per field type

---

## Spam Protection

- Honeypot hidden field (Slice 1)
- In-memory rate limit: 10 submissions / form / IP / hour (before public deploy)

---

## Migrations

- **Strategy:** One Drizzle migration per slice
- **Enums:** pgEnum for `field_type` and `form_version_status`
- **Slice 1 migration includes all indexes:**
  - `forms(workspace_id)`
  - `forms(public_slug)` UNIQUE
  - `forms(deleted_at)` partial WHERE NULL
  - `form_versions(form_id)`
  - `form_versions(form_id)` partial UNIQUE WHERE `status='draft'`
  - `form_versions(form_id)` partial UNIQUE WHERE `status='published'`
  - `form_fields(form_version_id)`
  - `form_fields(form_version_id, order)` UNIQUE
  - `responses(form_version_id)`
  - `responses(completed_at)`
  - `response_answers(response_id)`
  - `response_answers(field_id)`
  - `workspace_members(workspace_id, user_id)` UNIQUE

---

## Soft Delete

- `forms.deleted_at` + `workspaces.deleted_at` — soft delete only
- All child tables (`form_versions`, `form_fields`, `responses`, `response_answers`) — hard cascade
- GDPR: "Permanent delete" button hard-cascades everything

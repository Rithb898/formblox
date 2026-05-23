# Slice 1 — Implementation Plan

> Architecture reference: [slice-1-architecture.md](./slice-1-architecture.md)
> Goal: create a form, publish it, open the public link, see the question. FE + BE both working. Submittable.

---

## Phase 1 — Database & Schema

### 1.1 Create `packages/forms/` domain package
- [ ] `package.json`, `tsconfig.json`, wire into pnpm workspace
- [ ] `field-types.ts` — `FieldType` pgEnum values + TypeScript union
- [ ] `field-configs.ts` — Zod discriminated union for `config jsonb` (8 types, `short_text` + `long_text` fully defined, rest stubbed)
- [ ] `field-validators.ts` — `zodForField(field)` factory
- [ ] `response-builder.ts` — `buildResponseSchema(fields[])` (used in Slice 2)
- [ ] `index.ts` — re-exports

### 1.2 Add Drizzle models
- [ ] `packages/database/models/workspaces.ts`
- [ ] `packages/database/models/workspace-members.ts`
- [ ] `packages/database/models/forms.ts`
- [ ] `packages/database/models/form-versions.ts`
- [ ] `packages/database/models/form-fields.ts`
- [ ] `packages/database/models/responses.ts` (needed for FK; Slice 2 fills it out)
- [ ] `packages/database/models/response-answers.ts` (same)
- [ ] Export all from `packages/database/schema.ts`

### 1.3 Generate & run migration
- [ ] `pnpm db:generate` — generates Slice 1 migration
- [ ] Verify migration SQL includes all indexes (see architecture doc)
- [ ] `pnpm db:migrate` — apply to local DB
- [ ] Verify tables exist in DB

### 1.4 Auto-create personal workspace on signup
- [ ] Find user signup service/handler
- [ ] After user row insert, insert `workspaces` row + `workspace_members` row in same transaction

---

## Phase 2 — Backend (tRPC Routes)

### 2.1 Scaffold tRPC procedure ladder
- [ ] `authedProcedure` — verify session, attach `ctx.user` (check if exists already)
- [ ] `workspaceProcedure` — input has `workspaceId`, verify membership, attach `ctx.workspace`
- [ ] `formProcedure` — input has `formId`, verify `form.workspace_id` in user's workspaces, attach `ctx.form`

### 2.2 Workspaces router
- [ ] `workspaces.listMine` — list workspaces for current user
- [ ] `workspaces.get` — get single workspace by id

### 2.3 Forms router — `packages/trpc/server/routes/forms/`

**crud.ts**
- [ ] `forms.create` — insert `forms` row (generate nanoid(10) slug) + `form_versions` row (status=`draft`, version_number=1) in transaction; return form + draft version
- [ ] `forms.list` — list non-deleted forms in workspace, join latest version for title
- [ ] `forms.get` — get form + current draft version + fields
- [ ] `forms.softDelete` — set `deleted_at = now()`
- [ ] `forms.restore` — clear `deleted_at`

**versions.ts**
- [ ] `forms.versions.getDraft` — get current draft version + its fields (ordered by `order`)
- [ ] `forms.versions.updateDraft` — upsert full draft: update `form_versions` row, delete removed fields, upsert remaining fields, return updated draft
- [ ] `forms.versions.publish` — full publish transaction (validate → publish → archive old → clone new draft)
- [ ] `forms.versions.list` — list all versions for a form

**public.ts**
- [ ] `forms.public.getBySlug` — `publicProcedure`; find form by slug, get latest published version + fields; return 404-equivalent if no published version or `is_accepting_responses = false`

### 2.4 Register new routers in root tRPC router

---

## Phase 3 — Frontend: Editor

### 3.1 Zustand editor store
- [ ] `apps/web/stores/form-editor.ts`
- [ ] State shape: `{ formVersion, fields, selectedFieldId, dirty, lastSavedAt, isSaving }`
- [ ] Actions: `setForm`, `addField`, `updateField`, `removeField`, `reorderFields`, `selectField`, `markSaved`

### 3.2 Editor page & route
- [ ] Route: `app/(dashboard)/forms/[formId]/edit/page.tsx`
- [ ] On mount: fetch draft via `forms.versions.getDraft`, hydrate store
- [ ] Layout: 3-pane (palette | canvas | properties)

### 3.3 Field palette (left pane)
- [ ] List of addable field types with icons (Slice 1: `short_text`, `long_text`)
- [ ] Click → `addField` with defaults, auto-select new field

### 3.4 Canvas (center pane)
- [ ] `@dnd-kit/sortable` field list
- [ ] Each field card: type icon, label preview, drag handle, delete button
- [ ] Click field → `selectField`
- [ ] On drag end → `reorderFields` (bulk UPDATE `order` on save)

### 3.5 Property panel (right pane)
- [ ] `ShortTextPanel` — label, placeholder, required toggle, min/max length
- [ ] `LongTextPanel` — same as ShortTextPanel
- [ ] Stub panels for remaining 6 types (Slice 3)

### 3.6 Topbar
- [ ] Form title inline-edit (updates store)
- [ ] "Last saved X ago" indicator (reads `lastSavedAt`)
- [ ] "Saving..." state while mutation in-flight
- [ ] `Cmd+S` keybind → fire `forms.versions.updateDraft` mutation
- [ ] "Publish" button → fire `forms.versions.publish` mutation → show success toast with public link
- [ ] "View live" link (opens `/f/:slug` in new tab; disabled until first publish)

### 3.7 Forms dashboard
- [ ] Route: `app/(dashboard)/forms/page.tsx`
- [ ] List all workspace forms (title, status, response count placeholder, created date)
- [ ] "New form" button → `forms.create` mutation → redirect to editor
- [ ] Soft-delete action per form (confirm dialog)

---

## Phase 4 — Frontend: Public Form Runner

### 4.1 Public route
- [ ] Route: `app/f/[slug]/page.tsx` — `publicProcedure`, no auth
- [ ] Fetch form via `forms.public.getBySlug`
- [ ] If no published version → "not yet live" branded page
- [ ] If `is_accepting_responses = false` → "no longer accepting responses" page

### 4.2 Basic runner (Slice 1: all questions on one page)
> Note: one-question-per-screen UX is Slice 4. Slice 1 = simple stacked layout.

- [ ] Render all fields top-to-bottom
- [ ] `ShortTextInput`, `LongTextInput` components
- [ ] Required field visual indicator (`*`)
- [ ] Honeypot hidden input (spam protection)
- [ ] Submit button (Slice 2 wires it up; Slice 1 = disabled/placeholder)
- [ ] Thank-you screen component (shown post-submit in Slice 2)

---

## Phase 5 — Polish & Verify

- [ ] `pnpm check-types` passes
- [ ] Create a form in the editor
- [ ] Add 2 fields, reorder them, edit labels
- [ ] `Cmd+S` saves — "Last saved" updates
- [ ] Click Publish — success toast appears
- [ ] Open `/f/:slug` — public page shows fields
- [ ] Pre-publish: `/f/:slug` shows "not yet live"
- [ ] Soft-delete form → disappears from dashboard
- [ ] `git commit` — slice done, submittable

---

## Definition of Done

- [ ] Can create a form from dashboard
- [ ] Can add/reorder/configure `short_text` and `long_text` fields in editor
- [ ] Can publish the form
- [ ] Public `/f/:slug` URL renders the published form
- [ ] Pre-publish URL shows "not yet live" page
- [ ] All tRPC procedures have proper workspace/form authorization
- [ ] `check-types` passes
- [ ] Deployed (or deployable) — submittable right now

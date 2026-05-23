# Slice 1 — Implementation Plan

> Architecture reference: [slice-1-architecture.md](./slice-1-architecture.md)
> Goal: create a form, publish it, open the public link, see the question. FE + BE both working. Submittable.

---

## Phase 1 — Database & Schema

### 1.1 Create `packages/forms/` domain package
- [x] `package.json`, `tsconfig.json`, wire into pnpm workspace
- [x] `field-types.ts` — `FieldType` pgEnum values + TypeScript union
- [x] `field-configs.ts` — Zod discriminated union for `config jsonb` (8 types, `short_text` + `long_text` fully defined, rest stubbed)
- [x] `field-validators.ts` — `zodForField(field)` factory
- [x] `response-builder.ts` — `buildResponseSchema(fields[])` (used in Slice 2)
- [x] `index.ts` — re-exports

### 1.2 Add Drizzle models
- [x] `packages/database/models/workspaces.ts`
- [x] `packages/database/models/workspace-members.ts`
- [x] `packages/database/models/forms.ts`
- [x] `packages/database/models/form-versions.ts`
- [x] `packages/database/models/form-fields.ts`
- [x] `packages/database/models/responses.ts` (needed for FK; Slice 2 fills it out)
- [x] `packages/database/models/response-answers.ts` (same)
- [x] Export all from `packages/database/schema.ts`

### 1.3 Generate & run migration
- [x] `pnpm db:generate` — generates Slice 1 migration
- [x] Verify migration SQL includes all indexes (see architecture doc)
- [x] `pnpm db:migrate` — apply to local DB
- [x] Verify tables exist in DB

### 1.4 Auto-create personal workspace on signup
- [x] Find user signup service/handler
- [x] After user row insert, insert `workspaces` row + `workspace_members` row in same transaction

---

## Phase 2 — Backend (tRPC Routes)

### 2.1 Scaffold tRPC procedure ladder
- [x] `authedProcedure` — verify session, attach `ctx.user` (check if exists already)
- [x] `workspaceProcedure` — input has `workspaceId`, verify membership, attach `ctx.workspace`
- [x] `formProcedure` — input has `formId`, verify `form.workspace_id` in user's workspaces, attach `ctx.form`

### 2.2 Workspaces router
- [x] `workspaces.listMine` — list workspaces for current user
- [x] `workspaces.get` — get single workspace by id

### 2.3 Forms router — `packages/trpc/server/routes/forms/`

**crud.ts**
- [x] `forms.create` — insert `forms` row (generate nanoid(10) slug) + `form_versions` row (status=`draft`, version_number=1) in transaction; return form + draft version
- [x] `forms.list` — list non-deleted forms in workspace, join latest version for title
- [x] `forms.get` — get form + current draft version + fields
- [x] `forms.softDelete` — set `deleted_at = now()`
- [x] `forms.restore` — clear `deleted_at`

**versions.ts**
- [x] `forms.versions.getDraft` — get current draft version + its fields (ordered by `order`)
- [x] `forms.versions.updateDraft` — upsert full draft: update `form_versions` row, delete removed fields, upsert remaining fields, return updated draft
- [x] `forms.versions.publish` — full publish transaction (validate → publish → archive old → clone new draft)
- [x] `forms.versions.list` — list all versions for a form

**public.ts**
- [x] `forms.public.getBySlug` — `publicProcedure`; find form by slug, get latest published version + fields; return 404-equivalent if no published version or `is_accepting_responses = false`

### 2.4 Register new routers in root tRPC router — [x] done

---

## Phase 3 — Frontend: Editor

> **Design decisions (grilled & locked):**
> - Route group `app/(dashboard)/` with full sidebar layout
> - Sidebar: workspace name (top), Forms nav link, user avatar + logout (bottom)
> - Editor: fixed-width 3-pane — palette 240px | canvas fills | properties 300px
> - Drag-to-reorder via `@dnd-kit/core` + `@dnd-kit/sortable` (install first)
> - Selected field card: colored left border + subtle background
> - Empty property panel: "Select a field to edit its properties" placeholder
> - Save: manual only (`Cmd+S` + button), no autosave
> - Publish: sonner toast with public link + copy button, stay on editor
> - New form: create immediately with "Untitled form" → redirect to editor
> - Forms list: card grid, `...` menu per card (delete/restore), click → editor
> - Empty state: minimal — icon, copy, CTA button

### 3.0 Setup
- [x] Install `@dnd-kit/core` + `@dnd-kit/sortable`
- [x] Create `app/(dashboard)/layout.tsx` — auth guard + full sidebar (workspace name, Forms link, user avatar + logout)
- [x] Move existing `app/dashboard/page.tsx` → `app/(dashboard)/dashboard/page.tsx`

### 3.1 Zustand editor store
- [x] `apps/web/stores/form-editor.ts`
- [x] State shape: `{ formVersion, fields, selectedFieldId, dirty, lastSavedAt, isSaving }`
- [x] Actions: `setForm`, `addField`, `updateField`, `removeField`, `reorderFields`, `selectField`, `markSaved`, `setIsSaving`

### 3.2 Editor page & route
- [x] Route: `app/(dashboard)/forms/[formId]/edit/page.tsx`
- [x] On mount: fetch draft via `forms.versions.getDraft`, hydrate store
- [x] Layout: fixed 3-pane (palette 240px | canvas fills | properties 300px)

### 3.3 Field palette (left pane)
- [x] List of addable field types with icons (Slice 1: `short_text`, `long_text`)
- [x] Click → `addField` with defaults, auto-select new field

### 3.4 Canvas (center pane)
- [x] `@dnd-kit/sortable` field list
- [x] Each field card: type icon, label preview, drag handle, delete button
- [x] Selected card: colored left border + subtle background highlight
- [x] Click field → `selectField`
- [x] On drag end → `reorderFields` (bulk UPDATE `order` on save)

### 3.5 Property panel (right pane)
- [x] Empty state: "Select a field to edit its properties" placeholder (centered, muted)
- [x] `ShortTextPanel` — label, placeholder, required toggle, min/max length
- [x] `LongTextPanel` — same as ShortTextPanel
- [x] Stub panels for remaining 6 types (Slice 3)

### 3.6 Topbar
- [x] Form title inline-edit (updates store)
- [x] "Last saved X ago" indicator (reads `lastSavedAt`)
- [x] "Saving..." state while mutation in-flight
- [x] `Cmd+S` keybind → fire `forms.versions.updateDraft` mutation (manual only, no autosave)
- [x] Save button → same mutation
- [x] "Publish" button → fire `forms.versions.publish` → sonner toast with public link + copy button
- [x] "View live" link (opens `/f/:slug` in new tab; disabled until first publish)

### 3.7 Forms dashboard
- [x] Route: `app/(dashboard)/forms/page.tsx`
- [x] Card grid — each card: title, status badge (draft/published), created date, `...` menu (delete/restore)
- [x] Click card → navigate to editor
- [x] Empty state: icon + "No forms yet" + "Create your first form" button
- [x] "New form" button → `forms.create` mutation (title="Untitled form") → redirect to editor
- [x] Soft-delete via `...` menu (confirm dialog)

---

## Phase 4 — Frontend: Public Form Runner

### 4.1 Public route
- [x] Route: `app/f/[slug]/page.tsx` — `publicProcedure`, no auth
- [x] Fetch form via `forms.public.getBySlug`
- [x] If no published version → "not yet live" branded page
- [x] If `is_accepting_responses = false` → "no longer accepting responses" page

### 4.2 Basic runner (Slice 1: all questions on one page)
> Note: one-question-per-screen UX is Slice 4. Slice 1 = simple stacked layout.

- [x] Render all fields top-to-bottom
- [x] `ShortTextInput`, `LongTextInput` components
- [x] Required field visual indicator (`*`)
- [x] Honeypot hidden input (spam protection)
- [x] Submit button (Slice 2 wires it up; Slice 1 = disabled/placeholder)
- [x] Thank-you screen component (shown post-submit in Slice 2)

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

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

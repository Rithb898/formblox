# Slice 11 — Themes & Branding

**Goal:** Let form creators pick a preset accent color or custom hex, saved as `theme` JSON on `form_versions`. Form runner and editor canvas reflect the chosen accent via CSS variables.

**Schema:** `theme = { preset: "sunset" | "ocean" | "forest" | "midnight" | "rose" | "custom", accentColor: "#hex" }` — accent-only, all surface/text colors derived.

**Scope:** Theme affects form runner (`/f/[slug]`) and editor canvas (live preview). Does NOT affect dashboard, explore page, or editor chrome.

---

## Files to Create

### 1. `packages/forms/theme.ts` — Theme type + Zod schema

5 presets (Sunset/Ocean/Forest/Midnight/Rose) + custom. Each has name + default accent hex. Zod schema validates preset enum and 6-char hex.

### 2. `apps/web/lib/theme.ts` — Color utilities

- `computeOnAccentColor(hex)` → returns `#0a0a0a` for light accents, `#FFFFFF` for dark accents (luminance threshold)
- `themeToCSSVars(theme | null)` → Returns `Record<string, string>` of CSS variable → value pairs. Falls back to Sunset defaults if theme is null/undefined. Variables: `--form-accent`, `--form-bg`, `--form-surface`, `--form-surface-elevated`, `--form-avatar-bg`, `--form-text-primary`, `--form-text-muted`, `--form-text-label`, `--form-text-on-accent`

### 3. `apps/web/app/(dashboard)/forms/[formId]/edit/_components/theme-panel.tsx`

Renders in PropertyPanel when no field selected. Shows:
- Header row: "THEME" (same style as "PROPERTIES" header)
- 2×3 preset grid: each card = accent swatch (rounded-lg) + name below, selected state via ring-2
- Custom color section: native `<input type="color">` + hex text `<input>`

Clicking preset sets store theme + marks dirty. Changing color/hex sets `preset: "custom"`. Matching a preset by hex auto-selects that preset.

---

## Files to Modify

### 4. `packages/forms/index.ts` — Add `export * from "./theme";`

### 5. `packages/trpc/server/routes/forms/model.ts`
- Add `theme: themeSchema.nullable()` to `versionWithFieldsSchema`
- Add `theme: themeSchema.nullable()` to `publicFormSchema.version`

### 6. `packages/trpc/server/routes/forms/versions.ts`
- `updateDraft.input` adds `theme: themeSchema.nullable().optional()`
- `updateDraft` mutation saves `input.theme` alongside title/description
- `publish` mutation copies `draft.theme` into new draft row

### 7. `packages/trpc/server/routes/forms/public.ts`
- `getBySlug` returns `theme: published.theme` in version object

### 8. `apps/web/stores/form-editor.ts`
- Add `theme: FormTheme | null` to state
- Add `setTheme(theme)` action — marks dirty
- Modify `setForm(version, fields, theme?)` — sets theme without marking dirty

### 9. `apps/web/app/(dashboard)/forms/[formId]/edit/page.tsx`
- Pass `draftQuery.data.theme` to `setForm()`

### 10. `apps/web/app/(dashboard)/forms/[formId]/edit/_components/editor-topbar.tsx`
- `save()` includes `theme` from store in mutation payload

### 11. `apps/web/app/(dashboard)/forms/[formId]/edit/_components/property-panel.tsx`
- When no field selected, render `<ThemePanel />` instead of placeholder text

### 12. `apps/web/app/(dashboard)/forms/[formId]/edit/_components/field-canvas.tsx`
- Read `theme` from store, call `themeToCSSVars()`, apply as inline style on container
- Replace `bg-[#E8854A]/3` with `bg-[color-mix(in_srgb,var(--form-accent)_3%,transparent)]`

### 13. `apps/web/app/(dashboard)/forms/[formId]/edit/_components/field-card.tsx`
Replace all `#E8854A` refs with CSS variable equivalents using `var(--form-accent)` and `color-mix()` for opacity variants.

### 14. `apps/web/app/f/[slug]/page.tsx`
- Extract `theme` from `query.data.version.theme`, pass to `<FormRunner theme={theme} />`

### 15. `apps/web/app/f/[slug]/_components/form-runner.tsx`
- Add `theme` prop
- Apply `themeToCSSVars(theme)` as inline style on root container div
- Replace ALL hardcoded hexes with `var(--form-*)` CSS variables:
  - `#E8854A` → `var(--form-accent)`, opacity variants use `color-mix()`
  - `#080808` → `var(--form-bg)`
  - `#141414` → `var(--form-surface)`
  - `#1A1A1A` → `var(--form-surface-elevated)`
  - `#1E1E1E` → `var(--form-avatar-bg)`
  - `#F2F2F2` → `var(--form-text-primary)`
  - `#6B6B6B` → `var(--form-text-muted)`
  - `#9B9B9B` → `var(--form-text-label)`
  - `#0a0a0a` → `var(--form-text-on-accent)`
- Update confetti colors, radial glow, focus rings
- Leave structural things alone: `white/6`, `white/7`, `white/8` borders, progress bar track, skip chip `#3A3A3A`

### 16. `apps/web/app/(dashboard)/forms/[formId]/edit/page.tsx` — DragOverlay
Replace `#E8854A` refs in lines 167-178 with variable equivalents.

---

## Verification

1. DB: save "Ocean" preset, `theme` column = `{"preset":"ocean","accentColor":"#3B82F6"}`
2. Save persistence: custom `#FF00FF` survives reload
3. Publish copies theme to new draft
4. Form runner: blue accent everywhere (send, bubbles, progress, selected, focus, confetti, glow)
5. Editor canvas: field cards show blue accent for selected/required/type-icon
6. All 5 presets render correctly in runner
7. Old forms (null theme) fallback to Sunset — no visual change
8. Theme panel: correct preset highlighted on load, custom hex shows "custom" preset
9. AI follow-up bubbles look correct with non-orange accents
10. Typecheck passes across all packages

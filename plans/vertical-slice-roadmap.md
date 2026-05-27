# Formblox — Vertical Slice Roadmap

**Strategy:** Each slice = working FE + BE end-to-end. Always submittable. Ship thin, then thicken.

**Wedge:** AI-native conversational forms (Typeform + AI follow-ups + AI summary).

---

## Slice 0 — Foundation ✅
Turborepo + auth. Done.

## Slice 1 — Create & view a form ✅
> Architecture: [slice-1-architecture.md](./slice-1-architecture.md) · Implementation: [slice-1-plan.md](./slice-1-plan.md)

- **BE:** `workspaces` + `forms` + `form_versions` + `form_fields` tables, versioned CRUD, publish flow, `public_slug` (nanoid 10)
- **FE:** 3-pane editor (palette / dnd-kit canvas / property panel), Zustand store, explicit save (`Cmd+S`), public `/f/:slug` view
- ✅ Submittable

## Slice 2 — Collect responses ✅
> Implementation: [slice-2-plan.md](./slice-2-plan.md)

- **BE:** `responses` + `response_answers` tables, public submit with honeypot + Redis rate limiting, Zod field validation
- **FE:** Public form renders inputs, submits → thank-you screen → dashboard lists responses with answers
- ✅ Submittable — already a usable product

## Slice 3 — All 8 field types + form runner polish ✅
- **BE:** `form_fields.type` enum covers all 8 types: `short_text`, `long_text`, `email`, `number`, `single_choice`, `multiple_choice`, `rating`, `date`; strict Zod config validation per type on publish
- **FE:** Full type picker in editor, matching renderer in form runner; property panel shows correct config per type
- ✅ Submittable

## Slice 4 — One-question-per-screen UX (chat runner) ✅
- **BE:** no change
- **FE:** Typeform-style conversational runner — animated transitions, progress indicator, keyboard navigation (Enter to advance)
- ✅ Submittable — polished, looks differentiated

## Slice 5 — AI follow-up ✅ ← **the wedge**
- **BE:** `ai_followups` table; streaming Route Handler via Vercel AI SDK; per-field `enableAiFollowup` toggle stored in field config
- **FE:** After open-text answer, AI follow-up streams inline before advancing; skippable; stored on submit
- ✅ Submittable — differentiated

## Slice 6 — AI response summary ✅
- **BE:** `GET forms.responses.summaryData` — aggregates all answers and passes to Claude for synthesis
- **FE:** "Summary" tab in responses dashboard; streaming markdown render
- ✅ Submittable — complete story

## Slice 7 — AI form generation from prompt ✅
- **BE:** Route Handler `POST /api/ai/generate-form` → Claude returns full form JSON → saved as draft
- **FE:** "Generate with AI" button → prompt textarea → preview → edit → publish
- ✅ Submittable — second AI wow

## Slice 8 — Demo data + visibility modes + explore page ✅
> Hackathon requirement: 3+ themed forms, seeded responses, demo credentials, public explore page

- **BE:**
  - `visibility` enum (`public` | `unlisted`) on `forms` table (default `unlisted`), migration applied
  - `forms.public.listPublic` tRPC query — only `published` + `public` forms, with response/field counts
  - `forms.setVisibility` tRPC mutation
  - `packages/database/seed.ts` — 3 themed forms (Anime Fan Survey 20 responses, Startup Feedback 15, Gamer Preferences Poll 20) + AI followups; run via `pnpm db:seed`
- **FE:**
  - Visibility toggle pill in editor topbar (orange = public, grey = unlisted), click to toggle
  - `/explore` — bento grid, matches dashboard aesthetic, spotlight hover, skeleton loading, empty state
  - Explore link in landing navbar
- **Demo credentials:** `rithb8981@gmail.com` / `Rithb@8981`
- README rewritten with setup, stack, seeded data table, API docs link, scripts
- ✅ Submittable — judge-ready

## Slice 9 — Validation fixes + responsive polish ← **NOW**
> QA found critical gaps (see [playwright-qa-report.md](./playwright-qa-report.md))

- **FE:**
  - Show error messages on login, signup, forgot-password (empty submit, wrong creds, mismatch)
  - Form runner: reject empty required fields with inline error
  - Publish guard: block publish if title empty or any field unlabeled
  - Responsive: fix dashboard sidebar crush on mobile, fix response detail panel off-screen
  - Editor: degrade gracefully on tablet (collapse to 2-pane or single-pane)

## Slice 10 — README + Scalar API docs + CSV export
> Final submission requirements

- **README:** setup instructions, demo credentials, API docs link, deployed URL, stack overview
- **Scalar:** verify all public endpoints documented (`getBySlug`, `submit`, `saveFollowups`); add OpenAPI descriptions/examples
- **CSV export:** `GET /forms/:id/responses/export` → CSV download button in responses tab (bonus, high signal)

## Slice 11 — Themes & branding (stretch)
- **BE:** `theme` JSON already on `form_versions` — wire up presets
- **FE:** Theme panel in editor (5 presets + color picker), runner respects theme colors
- ✅ Looks professional — good for judges

## Slice 12+ — Bonus stretch
- Conditional logic / branching (logic JSON per field)
- Analytics dashboard (completion rate, drop-off, time-series chart)
- QR code sharing (per-form QR on share modal)
- Form clone / archive
- Embed widget (`<script>` snippet)
- Webhook + Slack/Discord notifications
- Templates gallery (10 pre-built forms)
- Response filtering + pagination
- Password-protected forms
- File upload field type

---

## Rules
- End of every slice: `git commit`, deploy, **could submit right now**
- No slice >1 day; if it grows, cut smaller
- Never start slice N+1 before N is fully working FE+BE

---

## Submission Checklist

- [ ] Public GitHub repo
- [ ] Deployed project link
- [ ] Demo credentials (`rithb8981@gmail.com` / `Rithb@8981`)
- [ ] API documentation link (Scalar at `/docs`)
- [ ] README with setup + stack + credentials
- [ ] 3+ themed seeded forms with responses
- [ ] Broken deploy = points off — keep it live

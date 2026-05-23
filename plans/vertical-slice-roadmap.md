# Formblox — Vertical Slice Roadmap

**Strategy:** Each slice = working FE + BE end-to-end. Always submittable. Ship thin, then thicken.

**Wedge:** AI-native conversational forms (Typeform + AI follow-ups + AI summary).

---

## Slice 0 — Foundation ✅
Turborepo + auth. Done.

## Slice 1 — Create & view a form (Day 1)
> Architecture: [slice-1-architecture.md](./slice-1-architecture.md) · Implementation: [slice-1-plan.md](./slice-1-plan.md)

- **BE:** `workspaces` + `forms` + `form_versions` + `form_fields` tables, versioned CRUD, publish flow, `public_slug` (nanoid 10)
- **FE:** 3-pane editor (palette / dnd-kit canvas / property panel), Zustand store, explicit save (`Cmd+S`), public `/f/:slug` view
- **Demo:** create form, publish, open slug link, see question
- ✅ Submittable

## Slice 2 — Collect responses (Day 1–2)
- **BE:** `responses` table, `POST /forms/:id/responses`, `GET /forms/:id/responses`
- **FE:** Public form renders input, submits → dashboard lists responses
- **Demo:** fill form, see answer in dashboard
- ✅ Submittable — already a usable product

## Slice 3 — More question types (Day 2)
- **BE:** `questions` table w/ `type` enum (text, choice, rating, long-text)
- **FE:** Type picker in editor, matching renderer in form view
- **Demo:** mixed-type form works end-to-end
- ✅ Submittable

## Slice 4 — One-question-per-screen UX (Day 3)
- **BE:** no change
- **FE:** Typeform-style runner — animated transitions, progress bar
- **Demo:** looks like Typeform now
- ✅ Submittable — polished

## Slice 5 — AI follow-up (Day 3–4) ← **the wedge**
- **BE:** `POST /forms/:id/responses/:rid/followup` → Claude call → returns next question or null
- **FE:** After open-text answer, show AI follow-up inline before next q
- **Demo:** the wow moment
- ✅ Submittable — differentiated

## Slice 6 — AI response summary (Day 4)
- **BE:** `GET /forms/:id/summary` → Claude summarizes all responses
- **FE:** "Summary" tab in dashboard
- ✅ Submittable — complete story

## Slice 7 — AI form generation from prompt (Day 5)
- **BE:** `POST /forms/generate` → Claude returns full form JSON (questions + types) → save
- **FE:** "Generate with AI" button → prompt textarea → preview → edit → save
- **Demo:** "make me a customer feedback form" → instant working form
- ✅ Submittable — second AI wow

## Slice 8 — Themes & branding (Day 5–6)
- **BE:** `theme` JSON column on `forms` (colors, font, bg)
- **FE:** Theme panel in editor (presets + color picker), runner respects theme
- **Demo:** same form, three different looks
- ✅ Submittable — looks professional

## Slice 9 — Conditional logic / branching (Day 6)
- **BE:** `logic` JSON on questions (`if answer === X, go to question Y`)
- **FE:** Simple logic UI per question (dropdown: "if X → jump to Y / end")
- **Demo:** branching path based on first answer
- ✅ Submittable — real form-builder feature

## Slice 10 — Analytics dashboard (Day 6–7)
- **BE:** `GET /forms/:id/analytics` → completion rate, drop-off per question, avg time, response count over time
- **FE:** Charts tab (recharts) — funnel + line chart + per-question stats
- **Demo:** "67% drop off at question 3"
- ✅ Submittable — feels like a real product

## Slice 11+ — Bonus stretch
- Embed widget (`<script>` snippet, popup + inline)
- Webhook + Slack/Discord notifications
- Templates gallery (10 pre-built forms)
- Share cards (OG image generation)
- Multi-language (auto-translate via Claude)
- Hidden fields (URL params)
- Save & resume (partial submissions)
- File upload question type
- Payment question (Stripe)
- Team workspaces

---

## Rules
- End of every slice: `git commit`, deploy, **could submit right now**
- No slice >1 day; if it grows, cut smaller
- Never start slice N+1 before N is fully working FE+BE

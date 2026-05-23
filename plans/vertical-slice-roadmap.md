# Formblox — Vertical Slice Roadmap

**Strategy:** Each slice = working FE + BE end-to-end. Always submittable. Ship thin, then thicken.

**Wedge:** AI-native conversational forms (Typeform + AI follow-ups + AI summary).

---

## Slice 0 — Foundation ✅
Turborepo + auth. Done.

## Slice 1 — Create & view a form (Day 1)
- **BE:** `forms` table, `POST /forms`, `GET /forms/:id`
- **FE:** "New form" button → text-only question editor → save → public view URL
- **Demo:** create form, open link, see question
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

## Slice 7+ — Bonus if time
Themes → embed widget → share card → templates → integrations (Slack/webhook/Sheets) → conditional logic → multi-language

---

## Rules
- End of every slice: `git commit`, deploy, **could submit right now**
- No slice >1 day; if it grows, cut smaller
- Never start slice N+1 before N is fully working FE+BE

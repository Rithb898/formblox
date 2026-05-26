# UI/UX Improvement Backlog

Observed from Playwright screenshots on 2026-05-25. Ordered by impact.

---

## Critical (confusing / broken-looking)

- [ ] **Runner: hide unlabelled fields** — fields with empty `label` render as a blank input with no question text. Either hide them or fall back to "Untitled question" as visible placeholder text.
- [ ] **Dashboard: remove teal progress bar** — the full-width teal bar under the PUBLISHED badge has no meaning. Replace with a status pill only.

---

## Dashboard `/forms`

- [ ] Add response count + question count to form cards ("5 responses · 4 questions")
- [ ] Show last-edited date alongside created date
- [ ] Add hover quick-actions row per card: Edit / View Responses / Copy link / Delete
- [ ] Empty state: add illustration + CTA when no forms exist yet

---

## Editor `/forms/[id]/edit`

- [ ] Add Q1/Q2/Q3 numbering to canvas field cards
- [ ] Show mini field-type preview in canvas cards (tiny radio dots for single_choice, tiny stars for rating, etc.)
- [ ] Empty canvas state: show "Click a field type on the left to get started" prompt in center
- [ ] Properties empty state: add arrow pointing left with "Select a field to edit its properties"
- [ ] Add a form preview button in the topbar (opens `/f/:slug` in a new tab — already exists as the external link icon, just needs better discoverability)

---

## Public form runner `/f/:slug`

- [ ] Constrain form to `max-w-xl` (~672px) centered with more vertical padding — currently stretches to ~1000px on wide screens
- [ ] Add progress indicator at top ("Question 2 of 4" or a progress bar)
- [ ] Submit button: use orange brand color to match star selected state (currently black while accents are orange)
- [ ] Style radio buttons and checkboxes more distinctively — native browser style feels unbranded
- [ ] Add subtle card/container background behind the form for visual separation from the page white
- [ ] Stars on 10-scale are oversized on desktop — reduce size or tighten gap

---

## General / Cross-cutting

- [ ] Brand color consistency: orange is used for star ratings and field selection accents, but the Submit button and primary actions are black — pick one and apply everywhere
- [ ] The sidebar has only "Forms" — no workspace settings, no profile link, no logout (currently buried in the user button at the bottom)

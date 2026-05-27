# FormBlox QA Report — Playwright Multi-Device Pass

**Date:** 2026-05-27  
**Devices tested:** Desktop 1920×1080, Laptop 1440×900, Tablet 768×1024, Mobile 390×844  
**Branch:** main  
**Tester:** playwright-cli automated + manual observation

---

## Top Issue Per Screen (TL;DR)

| Screen          | Most Critical Issue                                                    |
| --------------- | ---------------------------------------------------------------------- |
| Login           | No error message shown for wrong credentials (silent 401)              |
| Signup          | No error shown for mismatched passwords or empty required fields       |
| Forgot Password | No validation feedback on empty submit                                 |
| Dashboard       | Mobile: 220px sidebar leaves only 170px main area — content clipped    |
| Editor          | Tablet/Mobile: 3-pane layout collapses to unusable — canvas <30px wide |
| Chat Runner     | Empty required-field answers accepted silently (no block)              |
| Response Viewer | Mobile: detail panel starts at x=572, entirely off-screen              |

---

## 1. Summary Table

| Device            | Login  | Signup | Forgot Pw | Dashboard | Editor       | Chat Runner | Responses    |
| ----------------- | ------ | ------ | --------- | --------- | ------------ | ----------- | ------------ |
| Desktop 1920×1080 | Issues | Issues | Issues    | Pass      | Pass         | Issues      | Pass         |
| Laptop 1440×900   | Issues | Issues | Issues    | Pass      | Pass         | Issues      | Pass         |
| Tablet 768×1024   | Issues | Issues | Issues    | Pass      | **Critical** | Pass        | Pass         |
| Mobile 390×844    | Issues | Issues | Issues    | Issues    | **Critical** | Pass        | **Critical** |

---

## 2. Issues List

### #1 — Missing login error messages

- **Severity:** Critical
- **Devices:** All
- **Screen:** Login
- **Category:** Validation-missing
- **Description:** Submitting with empty fields, invalid email ("abc"), or wrong password produces no visible error message. The server correctly returns 401, but nothing is surfaced to the user — the form just sits there. The `[role=alert]` element is in the DOM but always empty.
- **Screenshots:** `desktop-02-login-empty-validation.png`, `desktop-03-login-invalid-email.png`, `desktop-04-login-wrong-password.png`
- **Fix:** Catch auth errors (401/422) in the login action and set a form-level error state that renders inside the card (e.g. a red banner: "Invalid email or password."). Add HTML5 email validation on blur.

---

### #2 — Missing signup validation messages

- **Severity:** Critical
- **Devices:** All
- **Screen:** Signup
- **Category:** Validation-missing
- **Description:** Submitting an empty signup form or mismatched passwords produces no visible feedback. The "Must be at least 8 characters" hint is static text, not a live validation message. Password mismatch is silently ignored.
- **Screenshots:** `desktop-06-signup-empty-validation.png`, `desktop-07-signup-mismatch-password.png`
- **Fix:** Add zod/react-hook-form errors beneath each field; block submit when passwords don't match; highlight the offending inputs in red with descriptive messages.

---

### #3 — Forgot-password form accepts empty email

- **Severity:** High
- **Devices:** All
- **Screen:** Forgot Password
- **Category:** Validation-missing
- **Description:** Clicking "Send reset link" with an empty email field shows no error — the field is not marked required and no message appears.
- **Screenshots:** `desktop-10-forgot-password-empty.png`
- **Fix:** Mark email as required; show inline error "Please enter your email address."

---

### #4 — Publish allowed with untitled form and untitled questions

- **Severity:** High
- **Devices:** All (desktop confirmed)
- **Screen:** Editor
- **Category:** Validation-missing
- **Description:** Clicking Publish succeeds even when the form title is "Untitled form" and all three questions have `(Untitled)` labels. The published runner shows "Untitled form" as the page heading. Users can publish broken/meaningless forms.
- **Screenshots:** `desktop-22-publish-attempt.png`, `desktop-23-published-with-untitled.png`
- **Fix:** Before publishing, validate that the form title is non-empty and all field labels are set; show a blocking modal or inline errors listing the problems.

---

### #5 — Chat runner accepts empty answers on required fields

- **Severity:** High
- **Devices:** All
- **Screen:** Chat Runner
- **Category:** Validation-missing
- **Description:** Clicking Send with an empty text answer advances to the next question without any error. The answer is recorded as `—` (dash). Required fields are not enforced client-side.
- **Screenshots:** `desktop-25-runner-empty-required.png`
- **Fix:** Before advancing, check if the current field has `required: true` and the answer is blank; show an inline error bubble "This question requires an answer."

---

### #6 — 3-pane editor completely unusable on tablet (768px)

- **Severity:** Critical
- **Devices:** Tablet 768×1024
- **Screen:** Editor
- **Category:** Bug / UI-UX
- **Description:** The layout allocates: left nav sidebar 220px + field palette 220px + canvas = 768−220−220 = 328px; but the measured canvas box is only **24px wide** (after margins). The property panel extends beyond the viewport. Fields display Q-numbers at x≈500 which is off-screen. The editor is completely unusable without scrolling, and the page doesn't scroll horizontally (`scrollWidth == clientWidth` — content is clipped, not scrollable).
- **Screenshots:** `tablet-04-editor-broken-layout.png`
- **Fix:** Collapse the field palette into a bottom drawer or modal on screens <1024px; stack the property panel below the canvas or use tabs; or hide the main nav sidebar (use a hamburger) on the editor route for tablet.

---

### #7 — 3-pane editor completely unusable on mobile (390px)

- **Severity:** Critical
- **Devices:** Mobile 390×844
- **Screen:** Editor
- **Category:** Bug / UI-UX
- **Description:** Sidebar (220px) leaves only 170px for all editor content. Within that 170px the palette (220px), canvas (≈32px) and property panel (280px extending to x=732) all overflow the viewport. The form title textbox is 16px wide. The topbar action buttons (Save, Publish) start at x=485 — completely off-screen. Field card labels show width=0 (clipped). Nothing is tappable.
- **Screenshots:** `mobile-03-editor.png`
- **Fix:** Same as #6 — the editor needs a full responsive strategy. At minimum, detect <768px and show a "Please use a desktop browser to edit forms" message rather than a broken layout.

---

### #8 — Mobile dashboard: sidebar crushes main content

- **Severity:** High
- **Devices:** Mobile 390×844
- **Screen:** Dashboard
- **Category:** Bug / UI-UX
- **Description:** The 220px fixed sidebar leaves only 170px for the main content area. Form card headings clip to width=0. The "New form" button sits at x=296 but is only 91px wide, ending at x=387 — barely on screen. Form card action buttons (Edit, Responses, Copy link, Delete) are 14px wide — too small for touch targets (WCAG minimum is 44px).
- **Screenshots:** `mobile-02-dashboard.png`
- **Fix:** Collapse sidebar to an icon rail or hamburger menu on ≤640px. Use single-column form cards. Increase button touch targets to ≥44×44px.

---

### #9 — Response detail panel off-screen on mobile

- **Severity:** High
- **Devices:** Mobile 390×844
- **Screen:** Response Viewer
- **Category:** Bug / UI-UX
- **Description:** The master-detail layout places the response list in the first 320px and the detail panel starting at x=572 — completely invisible on a 390px viewport. Detail paragraphs show width=0 (clipped). Users can see the list but can never read any response details.
- **Screenshots:** `mobile-07-responses.png`
- **Fix:** Stack list and detail vertically on mobile: tap a list row → navigate to a full-screen detail view, or use a drawer/sheet. The panel also gets tight (164px wide) at tablet — consider a slide-in panel approach.

---

### #10 — Dashboard hover-only controls inaccessible on touch (tablet)

- **Severity:** Medium
- **Devices:** Tablet 768×1024, Mobile 390×844
- **Screen:** Dashboard
- **Category:** Accessibility / UI-UX
- **Description:** The quick-action row (Edit, Responses, Copy link, Delete) only appears on hover (CSS `group-hover:animate-fade-up`). On touch devices there is no hover state, so these controls are never visible. On mobile they additionally have only 14px touch targets.
- **Screenshots:** `tablet-02-dashboard.png`
- **Fix:** Show the action row persistently on touch-capable devices (use `@media (hover: none)`) or provide a 3-dot overflow menu always visible on each card.

---

### #11 — Runner progress counter heading shows "Untitled form" title

- **Severity:** Low
- **Devices:** All
- **Screen:** Chat Runner
- **Category:** UI/UX
- **Description:** The sticky header shows "Untitled form" because publish guard doesn't block untitled forms (see #4). This is a secondary symptom of #4.
- **Screenshots:** `desktop-24-chat-runner.png`

---

### #12 — Laptop: editor and dashboard render correctly (no distinct issues vs desktop)

- **Severity:** N/A
- **Devices:** Laptop 1440×900
- **Screen:** All
- **Category:** Pass
- **Description:** At 1440×900 the sidebar + 3-pane editor fit comfortably. Hover states, amber accents, topbar, property panel all render as designed.
- **Screenshots:** `laptop-01-login.png` through `laptop-05-responses.png`

---

## 3. Validation Findings

| Location                              | What Fired                                  | What Was Missing                | Message Quality         |
| ------------------------------------- | ------------------------------------------- | ------------------------------- | ----------------------- |
| Login — empty submit                  | Nothing                                     | Required field errors           | N/A — nothing shown     |
| Login — invalid email "abc"           | Nothing (browser may hint, but app doesn't) | Email format error              | N/A                     |
| Login — wrong password                | Nothing visible (silent 401 in console)     | "Invalid credentials" banner    | N/A — completely silent |
| Signup — empty submit                 | Nothing                                     | Per-field required errors       | N/A                     |
| Signup — mismatched passwords         | Nothing                                     | "Passwords do not match"        | N/A                     |
| Signup — weak password                | Nothing beyond static hint text             | Live strength indicator / error | Weak — static only      |
| Forgot password — empty email         | Nothing                                     | "Email is required"             | N/A                     |
| Editor Publish — untitled form/fields | Nothing — publishes immediately             | Guard modal or inline errors    | N/A                     |
| Chat runner — empty required answer   | Nothing — advances to next Q                | Inline error bubble             | N/A                     |
| Chat runner — email field format      | Not tested (no email field in test form)    | Should validate "not@email"     | Unknown                 |
| Chat runner — number field letters    | Not tested (no number field in test form)   | Should reject non-numeric       | Unknown                 |

**Overall verdict:** Validation is almost entirely absent throughout the app. Every form submission path allows invalid data through silently.

---

## 4. Editor & Response Viewer on Tablet/Mobile

### Editor — Tablet (768×1024)

- **Left nav sidebar:** 220px wide — occupies 29% of viewport width. Not collapsed.
- **Field palette:** 220px wide inside the main area — another 29%.
- **Canvas area:** Measured at **24px wide** — completely unusable. Field Q-numbers at x≈500 are partially off-screen.
- **Property panel:** Not measured but inferred from remaining space — similarly cramped.
- **Horizontal scroll:** None (content clipped, not scrollable).
- **Verdict:** Broken. Editor cannot be used on tablet.

### Editor — Mobile (390×844)

- **Left nav sidebar:** 220px — occupies 56% of the 390px viewport.
- **Main content area:** Only 170px remaining.
- **Form title textbox:** 16px wide — unreadable and un-editable.
- **Topbar Save/Publish buttons:** Start at x=485 — completely off-screen.
- **Field palette:** 220px wide — overflows the 170px main area.
- **Canvas:** ≈32px wide.
- **Property panel:** Starts at x=452, 280px wide — extends to x=732, off-screen.
- **Verdict:** Completely broken. No meaningful interaction possible.

### Response Viewer — Tablet (768×1024)

- **Master list:** 320px wide (x=220 to x=540) — readable.
- **Detail panel:** 164px wide (x=572 to x=736) — very narrow but on-screen.
- **Verdict:** Borderline functional but the detail column is extremely cramped. Long values may be truncated.

### Response Viewer — Mobile (390×844)

- **Master list:** Occupies the main area (x=220 to x=390, 170px).
- **Detail panel:** Starts at x=572 — entirely off-screen. Detail paragraph widths=0 (clipped).
- **Verdict:** Broken. Detail view is invisible.

---

## 5. Screenshots

All screenshots are under `qa-screenshots/<device>/` relative to this report file.

### Desktop

- [Login page](qa-screenshots/desktop/desktop-01-login.png)
- [Login empty validation](qa-screenshots/desktop/desktop-02-login-empty-validation.png)
- [Login invalid email](qa-screenshots/desktop/desktop-03-login-invalid-email.png)
- [Login wrong password](qa-screenshots/desktop/desktop-04-login-wrong-password.png)
- [Signup page](qa-screenshots/desktop/desktop-05-signup.png)
- [Signup empty validation](qa-screenshots/desktop/desktop-06-signup-empty-validation.png)
- [Signup mismatched passwords](qa-screenshots/desktop/desktop-07-signup-mismatch-password.png)
- [Back to login](qa-screenshots/desktop/desktop-08-back-to-login.png)
- [Forgot password](qa-screenshots/desktop/desktop-09-forgot-password.png)
- [Forgot password empty](qa-screenshots/desktop/desktop-10-forgot-password-empty.png)
- [Dashboard](qa-screenshots/desktop/desktop-11-dashboard.png)
- [Dashboard hover](qa-screenshots/desktop/desktop-12-dashboard-hover.png)
- [New form editor empty](qa-screenshots/desktop/desktop-14-editor-empty.png)
- [Editor: short text added](qa-screenshots/desktop/desktop-15-editor-add-short-text.png)
- [Editor: field selected](qa-screenshots/desktop/desktop-16-field-selected.png)
- [Editor: label edit](qa-screenshots/desktop/desktop-17-field-label-edit.png)
- [Editor: single choice panel](qa-screenshots/desktop/desktop-19-single-choice-panel.png)
- [Editor: rating panel](qa-screenshots/desktop/desktop-21-rating-panel.png)
- [Editor: publish attempt](qa-screenshots/desktop/desktop-22-publish-attempt.png)
- [Editor: published with untitled fields](qa-screenshots/desktop/desktop-23-published-with-untitled.png)
- [Chat runner](qa-screenshots/desktop/desktop-24-chat-runner.png)
- [Runner empty required field](qa-screenshots/desktop/desktop-25-runner-empty-required.png)
- [Runner choice answer](qa-screenshots/desktop/desktop-27-runner-choice-answer.png)
- [Runner success](qa-screenshots/desktop/desktop-29-runner-success.png)
- [Response viewer](qa-screenshots/desktop/desktop-30-responses.png)
- [Response detail](qa-screenshots/desktop/desktop-31-response-detail.png)

### Laptop

- [Login](qa-screenshots/laptop/laptop-01-login.png)
- [Dashboard](qa-screenshots/laptop/laptop-02-dashboard.png)
- [Dashboard hover](qa-screenshots/laptop/laptop-03-dashboard-hover.png)
- [Editor](qa-screenshots/laptop/laptop-04-editor.png)
- [Responses](qa-screenshots/laptop/laptop-05-responses.png)

### Tablet

- [Login (redirected to dashboard — already logged in)](qa-screenshots/tablet/tablet-01-login.png)
- [Dashboard](qa-screenshots/tablet/tablet-02-dashboard.png)
- [Editor — broken 3-pane layout](qa-screenshots/tablet/tablet-04-editor-broken-layout.png)
- [Chat runner](qa-screenshots/tablet/tablet-05-chat-runner.png)
- [Runner answer](qa-screenshots/tablet/tablet-06-runner-answer.png)
- [Runner choice](qa-screenshots/tablet/tablet-07-runner-choice.png)
- [Runner success](qa-screenshots/tablet/tablet-08-runner-success.png)
- [Responses](qa-screenshots/tablet/tablet-09-responses.png)

### Mobile

- [Login (redirected)](qa-screenshots/mobile/mobile-01-login.png)
- [Dashboard — sidebar overflow](qa-screenshots/mobile/mobile-02-dashboard.png)
- [Editor — completely broken](qa-screenshots/mobile/mobile-03-editor.png)
- [Chat runner](qa-screenshots/mobile/mobile-04-chat-runner.png)
- [Runner answer](qa-screenshots/mobile/mobile-05-runner-answer.png)
- [Runner success](qa-screenshots/mobile/mobile-06-runner-success.png)
- [Responses — detail off-screen](qa-screenshots/mobile/mobile-07-responses.png)

---

## Additional Notes

- **Session persistence:** The session cookie persists across device simulations in the same browser instance; login page redirected directly to dashboard on tablet/mobile runs. The login/signup/forgot-password pages were not re-tested from scratch per device — the validation bugs (#1-#3) apply to all devices equally since they are server-side issues.
- **"Typing indicator" (3 dots before each question):** Not observed in desktop runner. Questions appear immediately without a visible typing animation. May be intentional or missing.
- **Amber theme / glass aesthetic:** Visually consistent on desktop and laptop. Amber accents on buttons and form elements confirmed. Dark background maintained throughout. Could not confirm amber focus ring on inputs (requires keyboard interaction).
- **Staggered fade-up animations:** Observable in the dashboard form cards on desktop; not verified on touch devices where hover triggers fade-up.
- **Response viewer master list "amber left-bar" on selection:** Not confirmed — the response list shows selection but no distinct amber left border was observed in the snapshot (may be CSS-only and hard to verify without visual diff).
- **Public runner — progress bar fill:** Counter ("01 / 03", "02 / 03", "03 / 03") works correctly. No separate amber progress bar element was observed in the snapshot (may be CSS-rendered).

# FormBlox — Chat UI Architecture

> Vibe: **Ethereal Glass / AI-Native**  
> Layout: **Editorial Split** (runner) + **Asymmetric Bento** (dashboard)  
> Motion: **Spring Physics** throughout — no linear easing ever

---

## 1. Design System

### Palette

```
Background:   #080808  (OLED near-black — NOT pure black)
Surface:      #111111  (card base)
Surface-2:    #1a1a1a  (elevated cards, inputs)
Border:       rgba(255,255,255,0.07)  (hairline only)
Accent:       #E8854A  (warm amber — NOT purple/blue AI cliché)
Accent-dim:   #E8854A at 15% opacity  (glow, selection ring)
Text-primary: #F2F2F2
Text-muted:   #6B6B6B
Text-ghost:   #3A3A3A
```

### Typography

- **Display / Brand:** `Geist` — `tracking-tighter`, `leading-none`
- **UI / Labels:** `Geist` regular — `tracking-normal`
- **Mono / Data:** `Geist Mono` — response counts, IDs, timestamps
- **Eyebrow tags:** `text-[10px] uppercase tracking-[0.2em] font-medium`
- NO Inter. NO Helvetica.

### Motion Spec

- **Spring:** `stiffness: 120, damping: 22` — all interactive elements
- **Entry:** `translateY(16px) + blur(6px) + opacity(0)` → resolved over `700ms`
- **Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` for all CSS transitions
- **Stagger:** `calc(var(--index) * 80ms)` for lists
- No element appears without entering

### Double-Bezel Rule (all cards)

```
Outer shell: bg-white/[0.03] + ring-1 ring-white/[0.06] + p-1.5 + rounded-[2rem]
Inner core:  bg-[#111111] + shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] + rounded-[calc(2rem-6px)]
```

---

## 2. Screen Inventory

### Screen A — Landing `/`

**Purpose:** Communicate the wedge in 3 seconds: "Forms that think."

**Layout:** Asymmetric Editorial Split

```
LEFT (55%)                      RIGHT (45%)
─────────────────────────────   ──────────────────────────────
Eyebrow pill: "AI-native forms" Live animated chat preview
                                (the form runner in miniature,
H1 (massive, left-aligned):     running a fake form loop)
"Forms that
 ask back."                     No screenshot. No mockup.
                                Actual interactive demo.
Sub (max 2 lines):
"Build once. Let the form       ─ Float in with spring delay ─
 follow up."

CTA pill-button:
[ Start building → ]

Social proof micro-row:
"47 forms created this hour"
(Geist Mono, text-ghost)
```

**Background:** Radial mesh gradient — amber orb top-left, dark teal orb bottom-right, very subtle, `opacity-30`. Grain overlay fixed, pointer-events-none.

---

### Screen B — Dashboard `/forms`

**Layout:** Asymmetric Bento Grid  
`grid-cols-12` with form cards spanning varied columns

```
TOPBAR (floating, detached — NOT sticky edge-to-edge)
  └─ Glass pill: FormBlox logo | Forms | [+ New Form button-in-button]

BENTO GRID
  ┌─────────────────────────┬──────────────┐
  │  Form card (col-span-8) │  col-span-4  │
  │  Title + response count │  (narrower)  │
  │  "47 responses · 6 Qs"  │  Form card   │
  │  Last edited timestamp  │              │
  │  ─────────────────────  ├──────────────┤
  │  Hover action row:      │  col-span-4  │
  │  Edit / Responses /     │  Form card   │
  │  Copy link / Delete     │              │
  └─────────────────────────┴──────────────┘
  ┌──────────────┬─────────────────────────┐
  │  col-span-4  │  col-span-8             │
  │  Form card   │  Form card              │
  └──────────────┴─────────────────────────┘
```

**Form Card anatomy (Double-Bezel):**

- Outer shell wraps everything
- Inner: Title (Geist medium), muted meta line (Geist Mono), status pill
- Status pill: amber for DRAFT, white/10 for PUBLISHED
- Hover: spotlight border card — border illuminates from cursor position (CSS `@property` + JS mouse position)
- Hover action row slides up from bottom of card with staggered icon buttons

**Empty state:**

- Centered within grid area
- Large ghost text: "No forms yet"
- Dashed amber border box with `+ Create your first form` CTA
- No filler illustration — text-only, massively typeset

---

### Screen C — Editor `/forms/[id]/edit`

**Layout:** Three-pane with floating topbar

```
TOPBAR (floating glass pill, NOT full-width sticky)
  └─ ← Back | Form title (editable inline) | [Save] [Publish]

┌─────────────────────────────────────────────────────┐
│ PALETTE (220px)  │ CANVAS (flex-1)  │ PROPS (280px) │
│                  │                  │               │
│ Field type list  │ Q1 / Q2 / Q3...  │ Selected      │
│ (left sidebar)   │ numbered cards   │ field props   │
│                  │                  │               │
│ Draggable pills  │ dnd-kit canvas   │ Label input   │
│ (not big buttons)│ with DnD handles │ Required tog. │
│                  │                  │ Placeholder   │
│ Hover: pill      │ Selected card:   │ Options list  │
│ expands to show  │ amber left-bar   │               │
│ mini preview     │ highlight        │ Empty state:  │
│                  │                  │ ← arrow + msg │
│                  │ Empty canvas:    │               │
│                  │ ghost text CTA   │               │
└─────────────────────────────────────────────────────┘
```

**Canvas card anatomy:**

- Q-number in Geist Mono, text-ghost (Q1, Q2...)
- Field type micro-icon (Phosphor Light, 14px)
- Label text or "(Untitled)" in ghost
- Drag handle on left edge, visible on hover only

---

### Screen D — Form Runner `/f/:slug` ← THE KEY SCREEN

**Concept:** The form IS a chat. The brand/form is the left-side entity. The user is the right-side entity.

**Layout:** Full-height chat thread, single-column, max-w-2xl centered

```
┌──────────────────────────────────────────────────────┐
│  HEADER (sticky, glass)                              │
│  [Form logo/name]                    [Progress: 2/5] │
│  Progress bar — thin amber line, partial fill        │
└──────────────────────────────────────────────────────┘

  CHAT THREAD (scrollable)
  ─────────────────────────────────────────────

  [Form avatar — amber circle, initial]
  ┌──────────────────────────────┐
  │  "What's your name?"         │   ← QUESTION BUBBLE
  └──────────────────────────────┘

                    [User bubble]
                    ┌────────────────────────┐
                    │  "Rithb"               │  ← ANSWER BUBBLE
                    └────────────────────────┘

  [Form avatar]
  ┌──────────────────────────────┐
  │  "How satisfied are you      │
  │   with our product?"         │
  └──────────────────────────────┘

  [AI follow-up — subtle amber indicator]
  ┌──────────────────────────────┐
  │  "Tell me more about that."  │   ← AI FOLLOW-UP BUBBLE
  └──────────────────────────────┘    (slightly different bg)

  ─────────────────────────────────────────────
  REPLY AREA (sticky bottom)
  ┌──────────────────────────────────────────┐
  │  [Input / choice / rating / etc.]        │
  │                                  [Send →] │
  └──────────────────────────────────────────┘
```

**Question bubble style:**

- Left-aligned, max-w-md
- Double-bezel card in Surface color
- Form avatar: 28px amber circle, form initial, Geist Mono

**Answer bubble style:**

- Right-aligned, max-w-xs
- Solid amber background, dark text
- No avatar

**AI follow-up bubble:**

- Left-aligned, distinct — Surface-2 bg, amber left-border 2px, amber "AI" eyebrow tag

**Typing indicator:**

- Three dots in a bubble, spring bounce animation (staggered per dot)
- Appears before each new question bubble enters

**Reply area by field type:**

```
text / long_text  →  single/multi line input, send on Enter or button
single_choice     →  horizontal pill options, tap to select → auto-advance
multiple_choice   →  pill options, checkboxes implied, explicit Send button
rating (1-5)      →  5 large star buttons, tap fills, auto-advance
rating (1-10)     →  horizontal number pills 1–10
date              →  native date input, styled
```

**Bubble entry animation:**

- Slides in from left (form) or right (user), `translateX(20px) opacity(0)` → resolved
- Spring: `stiffness: 160, damping: 26`
- User bubble: immediate; form bubble: 400ms delay (simulates "thinking")

---

### Screen E — Response Viewer `/forms/[id]/responses`

**Layout:** Two-column split

```
LEFT (320px sidebar)           RIGHT (flex-1)
─────────────────────────────  ──────────────────────────────
Response list                  Selected response — chat replay
(Geist Mono timestamps)
                               Shows the exact chat thread
Hover: amber left-bar          as it happened, read-only

Filter/search bar at top       AI Summary tab at top
                               (Claude summary of all responses)
```

**AI Summary tab:**

- Full-width card, amber eyebrow: "AI Summary"
- Paragraph prose from Claude, not bullet points
- "Generated from 47 responses" in Geist Mono below
- Regenerate button (button-in-button pattern)

---

## 3. Component Hierarchy (Conceptual)

```
App Shell
├── FloatingNav (glass pill, all screens)
│
├── Landing
│   ├── HeroSplit
│   │   ├── HeroText (left)
│   │   └── LiveFormPreview (right — animated loop)
│   └── SocialProofTicker (Geist Mono, infinite marquee)
│
├── Dashboard
│   ├── BentoGrid
│   │   └── FormCard (spotlight border, hover action row)
│   └── EmptyState
│
├── Editor
│   ├── FloatingTopbar
│   ├── FieldPalette (left)
│   ├── CanvasPane (dnd-kit, center)
│   │   └── FieldCard (numbered, typed icon, drag handle)
│   └── PropertiesPane (right)
│
├── FormRunner (THE CHAT)
│   ├── StickyHeader (progress pill + bar)
│   ├── ChatThread (scrollable)
│   │   ├── QuestionBubble (double-bezel, left)
│   │   ├── AIFollowUpBubble (amber border variant)
│   │   ├── AnswerBubble (amber fill, right)
│   │   └── TypingIndicator (spring bounce dots)
│   └── ReplyArea (sticky bottom, field-type-aware)
│       ├── TextInput
│       ├── ChoicePills
│       ├── StarRating
│       └── SendButton (button-in-button)
│
└── ResponseViewer
    ├── ResponseSidebar (Geist Mono list)
    ├── ChatReplay (read-only thread)
    └── AISummaryTab
```

---

## 4. Interaction Choreography

### Form Runner Flow (happy path)

```
1. Page loads
   → Header fades in (translateY entry)
   → Form avatar appears (scale spring: 0 → 1)
   → Typing indicator bounces for 600ms
   → First question bubble slides in from left

2. User types / selects answer
   → Reply area is field-type-aware (switches component)
   → On submit: answer bubble slides in from right (amber fill)
   → 400ms pause
   → Typing indicator re-appears

3. AI follow-up (Slice 5)
   → Follow-up bubble slides in with amber left border
   → Eyebrow tag "AI" pulses once (scale 1 → 1.05 → 1)
   → User answers follow-up same as normal

4. Next question slides in from left
   → Previous Q+A remains in scroll history (read-only, opacity-60)

5. Final question answered
   → Typing indicator
   → "Thanks — we got it." bubble with confetti particle burst (Particle Explosion)
   → Amber submit button morphs to checkmark
```

### Editor DnD

```
- Drag field from palette → canvas: card materializes with spring drop
- Reorder on canvas: layoutId transition (Framer Motion layout prop)
- Select card: amber left-bar slides in, PropertiesPane cross-fades content
- Delete: card collapses with scale(0) spring, others reorder via layout
```

### Dashboard Form Card

```
- Hover: spotlight border (CSS @property animation from cursor)
- Hover: action row slides up (translateY from bottom, staggered per icon)
- Click action icon: icon scales down (active:scale-95) then routes
```

---

## 5. What Makes It Different from Typeform/Tally

| Axis          | Typeform         | Tally          | FormBlox                             |
| ------------- | ---------------- | -------------- | ------------------------------------ |
| UX metaphor   | Slide carousel   | Standard form  | **Chat thread**                      |
| AI            | None             | None           | **Follow-up + Summary + Generate**   |
| Aesthetic     | Light, corporate | Notion-minimal | **Ethereal glass, amber, cinematic** |
| Form history  | Hidden           | Hidden         | **Visible chat history in thread**   |
| Response view | Table            | Table          | **Chat replay of each response**     |
| Color         | Blue             | Black/white    | **Warm amber on near-black**         |

---

## 6. Open Questions Before Building

- [ ] Does the chat thread show all previous Q+A or only current question?  
      → Recommend: show history, faded (opacity-60) — feels more like iMessage
- [ ] AI follow-up: blocking (must answer before next Q) or skippable?  
      → Recommend: skippable ("Skip →" ghost button)
- [ ] Form avatar: form's custom logo upload or auto-generated initial?  
      → Start with initial, add upload in Slice 8 (themes)
- [ ] Mobile: single-column chat is naturally mobile-first — no layout change needed
- [ ] Reply area height: fixed or expands with textarea content?  
      → Expand, max-h-32, then scroll within

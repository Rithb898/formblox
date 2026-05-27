# Slice 5 — AI Follow-Up Plan

## Decisions (from grilling session)
- Triggers on: `long_text` and `short_text` fields only
- Per-field toggle in editor, **default ON**
- Streaming responses (token-by-token, Vercel AI SDK)
- Stored in DB (new `ai_followups` table)
- Next.js Route Handler for streaming endpoint
- Vercel AI SDK — modular provider, swap model/provider with one env var
- Hardcoded system prompt
- Skippable (`user_answer` nullable)
- Takes effect on next publish only

---

## Step 1 — Install packages

In `apps/web/`:
```
pnpm add ai @ai-sdk/openai
```

`ai` = Vercel AI SDK core  
`@ai-sdk/openai` = OpenAI provider (swap to `@ai-sdk/anthropic` any time)

---

## Step 2 — Modular AI config

**New file: `apps/web/lib/ai.ts`**

```ts
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Swap this one line to change model or provider
export const aiModel = openai("gpt-4o-mini");

export const FOLLOWUP_SYSTEM_PROMPT = `You are a curious, empathetic interviewer.
The user is filling out a form. They just answered a question.
Based on their answer, ask ONE short, natural follow-up question to learn more.
Be conversational. Max 1 sentence. Never say "thank you" or "great answer".
Do not repeat the original question. Do not number the question.`;
```

To switch to Anthropic: replace with `@ai-sdk/anthropic` + `anthropic("claude-haiku-4-5-20251001")`.

---

## Step 3 — DB migration

### 3a. Update Drizzle models first, then generate + migrate

**Do NOT write SQL files manually.** Workflow:
1. Edit the Drizzle model files (below)
2. `cd packages/database && pnpm db:generate` — generates the SQL migration
3. `pnpm db:migrate` — applies it

### 3b. Update Drizzle model

**Edit: `packages/database/models/form-fields.ts`**
- Add `aiFollowupEnabled: boolean("ai_followup_enabled").notNull().default(true)`

**New file: `packages/database/models/ai-followups.ts`**
```ts
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { responsesTable } from "./responses";
import { formFieldsTable } from "./form-fields";

export const aiFollowupsTable = pgTable("ai_followups", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id").notNull().references(() => responsesTable.id, { onDelete: "cascade" }),
  fieldId: text("field_id").notNull().references(() => formFieldsTable.id, { onDelete: "restrict" }),
  aiQuestion: text("ai_question").notNull(),
  userAnswer: text("user_answer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("ai_followups_response_id_idx").on(table.responseId),
  index("ai_followups_field_id_idx").on(table.fieldId),
]);
```

**Edit: `packages/database/schema.ts`** — add `export * from "./models/ai-followups"`

Run: `pnpm db:migrate` (or however migration runs in this repo)

---

## Step 4 — Route Handler (streaming)

**New file: `apps/web/app/api/ai/followup/route.ts`**

```ts
import { streamText } from "ai";
import { aiModel, FOLLOWUP_SYSTEM_PROMPT } from "~/lib/ai";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string(),   // the original form field label
  answer: z.string(),     // the user's answer to that field
});

export async function POST(req: Request) {
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return new Response("Bad request", { status: 400 });

  const result = streamText({
    model: aiModel,
    system: FOLLOWUP_SYSTEM_PROMPT,
    prompt: `Original question: "${body.data.question}"\nUser answered: "${body.data.answer}"\n\nAsk a follow-up:`,
  });

  return result.toDataStreamResponse();
}
```

---

## Step 5 — tRPC mutations (save follow-up to DB)

**Edit: `packages/trpc/server/routes/forms/public.ts`** — add 2 mutations to `formsPublicRouter`:

### `saveFollowup`
Called after stream completes. Creates the `ai_followups` row.
```
input: { responseId, fieldId, aiQuestion }
output: { followupId }
```

### `answerFollowup`
Called when user submits or skips.
```
input: { followupId, answer: string | null }
output: void
```

Both are `publicProcedure` (no auth needed — respondent is anonymous).

---

## Step 6 — Editor toggle

**Edit: `apps/web/app/(dashboard)/forms/[formId]/edit/_components/panels/short-text-panel.tsx`**
**Edit: `apps/web/app/(dashboard)/forms/[formId]/edit/_components/panels/long-text-panel.tsx`**

Add a toggle row at the bottom of each panel:
```
[ AI Follow-up ] ○ (switch, default ON)
```

Reads/writes `field.config.aiFollowupEnabled` via the existing Zustand store + save flow. On next publish, the value lands in `form_fields.ai_followup_enabled`.

The `getBySlug` response already returns `fields` with `config` — include `aiFollowupEnabled` there so the form runner knows.

---

## Step 7 — Form runner

**Edit: `apps/web/app/f/[slug]/_components/form-runner.tsx`**

### New state
```ts
type FollowupState =
  | { phase: "idle" }
  | { phase: "streaming"; text: string }
  | { phase: "waiting"; followupId: string; question: string }
  | { phase: "done" };

const [followup, setFollowup] = useState<FollowupState>({ phase: "idle" });
```

### After `validateAndAdvance` saves user answer:
1. Check if current field has `aiFollowupEnabled` (from field config) AND type is `short_text`/`long_text`
2. If yes → call `/api/ai/followup` via `useCompletion` or manual `fetch` with `ReadableStream`
3. Stream tokens into `followup.text` → renders live in `AiFollowUpBubble`
4. On stream end → call `saveFollowup` tRPC mutation → get `followupId` → set phase to `waiting`
5. Show reply input + "Skip" button
6. On submit → call `answerFollowup` → advance to next field
7. On skip → call `answerFollowup({ answer: null })` → advance

### UI flow in thread:
```
[Q bubble] ← form question
[A bubble] ← user's answer
[AI bubble streaming...] ← AiFollowUpBubble (already built)
[reply input + Skip] ← new FollowupReply component
[Q bubble] ← next form question
```

Use Vercel AI SDK's `useCompletion` hook or manual streaming with `ReadableStream` + `TextDecoder`.

---

## Step 8 — Responses dashboard (bonus, shows AI turns)

**Edit: `apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx`**

For each response, after the field answer row, if there's an `ai_followups` entry for that field:
- Show "AI asked: …" in a muted style
- Show "Replied: …" or "Skipped" beneath it

This requires updating `formsResponsesRouter.list` to also JOIN `ai_followups`.

---

## File checklist

| File | Action |
|------|--------|
| `packages/database/drizzle/0005_ai_followup.sql` | Create |
| `packages/database/models/ai-followups.ts` | Create |
| `packages/database/models/form-fields.ts` | Edit (add column) |
| `packages/database/schema.ts` | Edit (add export) |
| `apps/web/lib/ai.ts` | Create |
| `apps/web/app/api/ai/followup/route.ts` | Create |
| `packages/trpc/server/routes/forms/public.ts` | Edit (2 mutations) |
| `packages/trpc/server/routes/forms/responses.ts` | Edit (JOIN followups) |
| `apps/web/app/(dashboard)/forms/[formId]/edit/_components/panels/short-text-panel.tsx` | Edit (toggle) |
| `apps/web/app/(dashboard)/forms/[formId]/edit/_components/panels/long-text-panel.tsx` | Edit (toggle) |
| `apps/web/app/f/[slug]/_components/form-runner.tsx` | Edit (followup flow) |
| `apps/web/app/(dashboard)/forms/[formId]/responses/page.tsx` | Edit (show AI turns) |
| `apps/web/.env.local` | Add `OPENAI_API_KEY` |
| `apps/web/package.json` | Add `ai`, `@ai-sdk/openai` |

---

## Env vars needed

```
# apps/web/.env.local
OPENAI_API_KEY=sk-...

# To switch to Anthropic later:
# ANTHROPIC_API_KEY=sk-ant-...
# (update lib/ai.ts to use @ai-sdk/anthropic)
```

---

## Order of implementation

1. Install packages
2. `lib/ai.ts`
3. DB migration + Drizzle models
4. Route Handler
5. tRPC mutations
6. Editor toggle
7. Form runner follow-up flow
8. Responses dashboard (if time)

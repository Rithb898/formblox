import { streamText } from "ai";
import { z } from "zod";
import { aiModel, FOLLOWUP_SYSTEM_PROMPT } from "~/lib/ai";
import { clientIp, rateLimit } from "~/lib/rate-limit";

const bodySchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed } = await rateLimit(`ai:followup:${ip}`, 30, 60);
  if (!allowed) return new Response("Rate limited", { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { question, answer } = parsed.data;

  const result = streamText({
    model: aiModel,
    system: FOLLOWUP_SYSTEM_PROMPT,
    prompt: `Original question: "${question}"\nTheir answer: "${answer}"\n\nAsk one follow-up question:`,
    maxOutputTokens: 100,
  });

  return result.toTextStreamResponse();
}

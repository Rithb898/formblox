import { streamText } from "ai";
import { z } from "zod";
import { aiModel, SUMMARY_SYSTEM_PROMPT } from "~/lib/ai";
import { getUserIdFromCookies } from "~/lib/auth";
import { rateLimit } from "~/lib/rate-limit";

const bodySchema = z.object({
  formTitle: z.string(),
  responseCount: z.number().int().positive(),
  fields: z.array(
    z.object({
      label: z.string(),
      type: z.string(),
      summary: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const userId = await getUserIdFromCookies();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { allowed } = await rateLimit(`ai:summary:${userId}`, 30, 3600);
  if (!allowed) return new Response("Rate limited", { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { formTitle, responseCount, fields } = parsed.data;

  const prompt = [
    `Form: "${formTitle}" — ${responseCount} total response${responseCount === 1 ? "" : "s"}`,
    "",
    ...fields.map((f) => `Question: ${f.label}\nType: ${f.type}\nData:\n${f.summary}`),
  ].join("\n\n");

  const result = streamText({
    model: aiModel,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 600,
  });

  return result.toTextStreamResponse();
}

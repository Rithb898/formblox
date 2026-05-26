import { generateObject } from "ai";
import { z } from "zod";
import { aiModel, GENERATE_SYSTEM_PROMPT } from "~/lib/ai";
import { FIELD_TYPES } from "@repo/forms";

const bodySchema = z.object({
  prompt: z.string().min(1).max(500),
});

const generatedFormSchema = z.object({
  title: z.string().describe("A concise, descriptive title for this form"),
  fields: z.array(z.object({
    type: z.enum(FIELD_TYPES).describe("The field type"),
    label: z.string().describe("The question or prompt shown to respondents"),
    required: z.boolean().describe("Whether this field must be answered"),
    config: z.record(z.string(), z.unknown()).describe("Type-specific config: options[] for choices, min/max for rating, aiFollowupEnabled for text"),
  })).min(1).max(10),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  try {
    const { object } = await generateObject({
      model: aiModel,
      schema: generatedFormSchema,
      system: GENERATE_SYSTEM_PROMPT,
      prompt: `Create a form for: ${parsed.data.prompt}\n\nGenerate 5–8 well-chosen fields.`,
    });

    return Response.json(object);
  } catch {
    return new Response("Generation failed", { status: 500 });
  }
}

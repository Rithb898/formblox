import { generateObject } from "ai";
import { nanoid } from "nanoid";
import { z } from "zod";
import { aiModel, GENERATE_SYSTEM_PROMPT } from "~/lib/ai";
import { getUserIdFromCookies } from "~/lib/auth";
import { rateLimit } from "~/lib/rate-limit";
import { FIELD_TYPES, type FieldType } from "@repo/forms";

const bodySchema = z.object({
  prompt: z.string().min(1).max(500),
});

const generatedFormSchema = z.object({
  title: z.string().describe("A concise, descriptive title for this form"),
  fields: z
    .array(
      z.object({
        type: z.enum(FIELD_TYPES).describe("The field type"),
        label: z.string().describe("The question or prompt shown to respondents"),
        required: z.boolean().describe("Whether this field must be answered"),
        config: z
          .object({
            options: z
              .array(z.string())
              .nullable()
              .describe("For single_choice/multiple_choice: 3–5 short label strings"),
            scale: z
              .union([z.literal(5), z.literal(10)])
              .nullable()
              .describe("For rating: 5 or 10"),
            style: z
              .union([z.literal("star"), z.literal("number")])
              .nullable()
              .describe("For rating: star or number"),
            aiFollowupEnabled: z
              .boolean()
              .nullable()
              .describe("For short_text/long_text: enable AI follow-up questions"),
          })
          .describe("Type-specific config. Leave irrelevant keys null."),
      }),
    )
    .min(1)
    .max(10),
});

type RawConfig = z.infer<typeof generatedFormSchema>["fields"][number]["config"];

// Coerce loose AI config into the canonical shape expected by fieldConfigSchemas / publish.
function normalizeConfig(type: FieldType, raw: RawConfig): Record<string, unknown> {
  switch (type) {
    case "single_choice":
    case "multiple_choice": {
      const options = (raw.options ?? [])
        .map((label) => label?.trim())
        .filter((label): label is string => Boolean(label))
        .map((label) => ({ id: nanoid(), label }));
      while (options.length < 2) {
        options.push({ id: nanoid(), label: `Option ${options.length + 1}` });
      }
      return { options };
    }
    case "rating":
      return {
        scale: raw.scale === 10 ? 10 : 5,
        style: raw.style === "number" ? "number" : "star",
      };
    case "short_text":
    case "long_text":
      return { aiFollowupEnabled: raw.aiFollowupEnabled ?? true };
    default:
      return {};
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromCookies();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { allowed } = await rateLimit(`ai:generate-form:${userId}`, 20, 3600);
  if (!allowed) return new Response("Rate limited", { status: 429 });

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

    const fields = object.fields.map((f) => ({
      type: f.type,
      label: f.label,
      required: f.required,
      config: normalizeConfig(f.type, f.config),
    }));

    return Response.json({ title: object.title, fields });
  } catch (err) {
    console.error("[generate-form] error:", err);
    return new Response("Generation failed", { status: 500 });
  }
}

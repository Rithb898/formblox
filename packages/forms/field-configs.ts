import { z } from "zod";

const choiceOption = z.object({ id: z.string(), label: z.string() });

export const fieldConfigSchemas = {
  short_text: z.object({
    placeholder: z.string().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
  }),

  long_text: z.object({
    placeholder: z.string().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
  }),

  email: z.object({
    placeholder: z.string().optional(),
  }),

  number: z.object({
    placeholder: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  }),

  single_choice: z.object({
    options: z.array(choiceOption).min(2),
    randomize: z.boolean().optional(),
  }),

  multiple_choice: z.object({
    options: z.array(choiceOption).min(2),
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(1).optional(),
    randomize: z.boolean().optional(),
  }),

  rating: z.object({
    scale: z.union([z.literal(5), z.literal(10)]),
    style: z.union([z.literal("star"), z.literal("number")]),
    labels: z.object({ min: z.string(), max: z.string() }).optional(),
  }),

  date: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    format: z.string().optional(),
  }),
} as const;

export type FieldConfigs = {
  [K in keyof typeof fieldConfigSchemas]: z.infer<(typeof fieldConfigSchemas)[K]>;
};

export const fieldConfigUnion = z.discriminatedUnion("type", [
  z.object({ type: z.literal("short_text"), config: fieldConfigSchemas.short_text }),
  z.object({ type: z.literal("long_text"), config: fieldConfigSchemas.long_text }),
  z.object({ type: z.literal("email"), config: fieldConfigSchemas.email }),
  z.object({ type: z.literal("number"), config: fieldConfigSchemas.number }),
  z.object({ type: z.literal("single_choice"), config: fieldConfigSchemas.single_choice }),
  z.object({ type: z.literal("multiple_choice"), config: fieldConfigSchemas.multiple_choice }),
  z.object({ type: z.literal("rating"), config: fieldConfigSchemas.rating }),
  z.object({ type: z.literal("date"), config: fieldConfigSchemas.date }),
]);

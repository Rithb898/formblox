import { fieldTypeSchema, themeSchema } from "@repo/forms";
import { z } from "../../schema";

export const fieldOutputSchema = z.object({
  id: z.string().describe("Field UUID"),
  order: z.number().describe("Display order (0-indexed)"),
  type: fieldTypeSchema.describe("Field type (e.g. short_text, long_text)"),
  label: z.string().describe("Question label shown to respondents"),
  required: z.boolean().describe("Whether the field must be answered before submitting"),
  config: z
    .record(z.string(), z.unknown())
    .describe("Type-specific configuration (e.g. min/max length, choices)"),
});

export const fieldInputSchema = z.object({
  id: z.string().describe("Field nanoid — client-generated, used as stable key"),
  order: z.number().describe("Display order (0-indexed)"),
  type: fieldTypeSchema.describe("Field type (e.g. short_text, long_text)"),
  label: z.string().describe("Question label"),
  required: z.boolean().describe("Whether the field is required"),
  config: z.record(z.string(), z.unknown()).describe("Type-specific configuration"),
});

export const versionSummarySchema = z.object({
  id: z.string().describe("Version UUID"),
  versionNumber: z.number().describe("Monotonically increasing version number"),
  status: z.string().describe("draft | published | archived"),
  title: z.string().describe("Form title for this version"),
  description: z.string().nullable().describe("Optional form description"),
});

export const versionWithFieldsSchema = z.object({
  id: z.string().describe("Version UUID"),
  formId: z.string().describe("Parent form UUID"),
  versionNumber: z.number().describe("Monotonically increasing version number"),
  status: z.string().describe("draft | published | archived"),
  title: z.string().describe("Form title for this version"),
  description: z.string().nullable().describe("Optional form description"),
  publishedAt: z.date().nullable().describe("When this version was published"),
  createdAt: z.date().describe("When this version was created"),
  theme: themeSchema.nullable().describe("Theme configuration (accent color + preset)"),
  fields: z.array(fieldOutputSchema).describe("Fields ordered by their display order"),
});

export const formWithVersionSchema = z.object({
  id: z.string().describe("Form UUID"),
  workspaceId: z.string().describe("Owning workspace UUID"),
  publicSlug: z.string().describe("URL-safe slug used in the public form link"),
  isAcceptingResponses: z.boolean().describe("Whether the form is open for new responses"),
  visibility: z
    .enum(["public", "unlisted"])
    .describe("public = appears in explore; unlisted = link-only"),
  deletedAt: z.date().nullable().describe("Soft-delete timestamp; null if not deleted"),
  createdAt: z.date().describe("When the form was created"),
  version: versionSummarySchema.describe("Current draft version metadata"),
});

export const formListItemSchema = z.object({
  id: z.string().describe("Form UUID"),
  publicSlug: z.string().describe("Public URL slug"),
  isAcceptingResponses: z.boolean().describe("Whether the form accepts responses"),
  createdAt: z.date().describe("Form creation timestamp"),
  title: z.string().describe("Title from the most relevant version"),
  status: z.string().describe("Status of the most relevant version (draft | published)"),
});

export const publicFormSchema = z.object({
  form: z
    .object({
      id: z.string().describe("Form UUID"),
      publicSlug: z.string().describe("Public URL slug"),
      isAcceptingResponses: z.boolean().describe("Whether new responses are accepted"),
    })
    .describe("Form metadata"),
  version: z
    .object({
      id: z.string().describe("Published version UUID"),
      title: z.string().describe("Form title"),
      description: z.string().nullable().describe("Optional form description"),
      theme: themeSchema.nullable().describe("Theme configuration"),
    })
    .describe("Published version metadata"),
  fields: z.array(fieldOutputSchema).describe("Ordered list of form fields"),
});

export const responseAnswerSchema = z.object({
  fieldId: z.string().describe("Field nanoid the answer belongs to"),
  label: z.string().describe("Question label from the response's own version"),
  type: z.string().describe("Field type (e.g. short_text, long_text)"),
  value: z.unknown().describe("The submitted answer value"),
  followup: z
    .object({
      aiQuestion: z.string(),
      userAnswer: z.string().nullable(),
    })
    .nullable()
    .describe("AI follow-up Q&A for this answer, if any"),
});

export const responseListItemSchema = z.object({
  id: z.string().describe("Response UUID"),
  completedAt: z.date().nullable().describe("When the response was submitted"),
  answers: z.array(responseAnswerSchema).describe("Answers ordered by field order"),
});

export const responseListSchema = z.array(responseListItemSchema);

export const responseListPageSchema = z.object({
  items: z.array(responseListItemSchema),
  total: z.number().int().describe("Total completed responses for the form"),
  nextCursor: z.number().int().nullable().describe("Offset of the next page, or null"),
});

export const followupInputSchema = z.object({
  fieldId: z.string().max(64).describe("Field nanoid that triggered the follow-up"),
  aiQuestion: z.string().max(2000).describe("The AI-generated follow-up question"),
  userAnswer: z.string().max(10000).nullable().describe("User's reply, or null if skipped"),
});

export const summaryFieldSchema = z.object({
  label: z.string(),
  type: z.string(),
  summary: z.string(),
});

export const summaryDataSchema = z.object({
  formTitle: z.string(),
  responseCount: z.number(),
  fields: z.array(summaryFieldSchema),
});

export const exploreFormSchema = z.object({
  id: z.string(),
  publicSlug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  responseCount: z.number(),
  fieldCount: z.number(),
  publishedAt: z.date().nullable(),
});

export type FieldOutput = z.infer<typeof fieldOutputSchema>;
export type VersionWithFields = z.infer<typeof versionWithFieldsSchema>;
export type FormWithVersion = z.infer<typeof formWithVersionSchema>;
export type SummaryData = z.infer<typeof summaryDataSchema>;
export type ExploreForm = z.infer<typeof exploreFormSchema>;

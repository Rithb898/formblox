import { z } from "zod";

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_choice",
  "multiple_choice",
  "rating",
  "date",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const fieldTypeSchema = z.enum(FIELD_TYPES);

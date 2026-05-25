import { z } from "zod";
import { type FieldForValidation, zodForField } from "./field-validators";
import { coerceAnswers } from "./coerce-answers";

// Validates a respondent's answers. Empty answers are stripped first (so required
// fields left blank fail as missing), and unknown field ids are rejected (strict).
// The same schema is used by the form runner (client) and the submit mutation (server).
export function buildResponseSchema(
  fields: FieldForValidation[],
): z.ZodType<Record<string, unknown>, Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.id] = zodForField(field);
  }
  return z.preprocess(
    (raw) => coerceAnswers((raw ?? {}) as Record<string, unknown>),
    z.strictObject(shape),
  ) as z.ZodType<Record<string, unknown>, Record<string, unknown>>;
}

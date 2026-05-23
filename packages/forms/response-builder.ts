import { z } from "zod";
import { type FieldForValidation, zodForField } from "./field-validators";

export function buildResponseSchema(fields: FieldForValidation[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.id] = zodForField(field);
  }
  return z.object(shape);
}

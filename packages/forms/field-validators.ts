import { z } from "zod";
import { type FieldType } from "./field-types";
import { fieldConfigSchemas } from "./field-configs";

export type FieldForValidation = {
  id: string;
  type: FieldType;
  required: boolean;
  config: unknown;
};

export function zodForField(field: FieldForValidation): z.ZodTypeAny {
  const { type, required, config } = field;

  let schema: z.ZodTypeAny;

  switch (type) {
    case "short_text": {
      const cfg = fieldConfigSchemas.short_text.parse(config ?? {});
      let s = z.string();
      if (cfg.minLength !== undefined) s = s.min(cfg.minLength);
      if (cfg.maxLength !== undefined) s = s.max(cfg.maxLength);
      schema = s;
      break;
    }
    case "long_text": {
      const cfg = fieldConfigSchemas.long_text.parse(config ?? {});
      let s = z.string();
      if (cfg.minLength !== undefined) s = s.min(cfg.minLength);
      if (cfg.maxLength !== undefined) s = s.max(cfg.maxLength);
      schema = s;
      break;
    }
    case "email": {
      schema = z.email();
      break;
    }
    case "number": {
      const cfg = fieldConfigSchemas.number.parse(config ?? {});
      let s = z.number();
      if (cfg.min !== undefined) s = s.min(cfg.min);
      if (cfg.max !== undefined) s = s.max(cfg.max);
      schema = s;
      break;
    }
    case "single_choice": {
      const cfg = fieldConfigSchemas.single_choice.parse(config ?? { options: [] });
      const ids = cfg.options.map((o) => o.id);
      schema = z.string().refine((v) => ids.includes(v), { message: "Invalid option" });
      break;
    }
    case "multiple_choice": {
      const cfg = fieldConfigSchemas.multiple_choice.parse(config ?? { options: [] });
      const ids = cfg.options.map((o) => o.id);
      let s = z.array(z.string().refine((v) => ids.includes(v), { message: "Invalid option" }));
      if (cfg.min !== undefined) s = s.min(cfg.min);
      if (cfg.max !== undefined) s = s.max(cfg.max);
      schema = s;
      break;
    }
    case "rating": {
      const cfg = fieldConfigSchemas.rating.parse(config ?? { scale: 5, style: "star" });
      schema = z.number().int().min(1).max(cfg.scale);
      break;
    }
    case "date": {
      schema = z.string();
      break;
    }
    default: {
      schema = z.unknown();
    }
  }

  if (!required) {
    return schema.optional();
  }

  return schema;
}

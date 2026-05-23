import { z } from "zod";

export const zodUndefinedModel = z.preprocess(
  (val) =>
    val != null && typeof val === 'object' && Object.keys(val as object).length === 0
      ? undefined
      : val,
  z.void(),
);
export { z };

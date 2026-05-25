function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Drops keys whose value is empty (empty/whitespace string, null, undefined, empty array)
// so unanswered fields become absent. Unknown keys are preserved for the schema to reject.
export function coerceAnswers(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!isEmpty(value)) out[key] = value;
  }
  return out;
}

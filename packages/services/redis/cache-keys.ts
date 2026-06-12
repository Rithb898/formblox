import { redisClient } from "./index";

export const CacheKeys = {
  formSlug: (slug: string) => `form:slug:${slug}`,
  formSummary: (formId: string) => `form:summary:${formId}`,
  formResponses: (formId: string) => `form:responses:v2:${formId}`,
  formsPublicList: () => `forms:public:list`,
  workspaceForms: (workspaceId: string) => `workspace:forms:${workspaceId}`,
  userWorkspaces: (userId: string) => `user:workspaces:${userId}`,
  formAiSummary: (formId: string, responseCount: number) =>
    `form:ai-summary:${formId}:${responseCount}`,
} as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) return new Date(value);
  return value;
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await redisClient.get(key);
  if (cached !== null) return JSON.parse(cached, dateReviver) as T;
  const result = await fn();
  await redisClient.set(key, JSON.stringify(result), "EX", ttlSeconds);
  return result;
}

export async function invalidateKeys(...keys: string[]): Promise<void> {
  if (keys.length > 0) await redisClient.del(...keys);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) await redisClient.del(...keys);
}

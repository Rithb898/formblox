import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "prod"]).default("development"),
  COOKIE_DOMAIN: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(env);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export const env = createEnv(process.env);

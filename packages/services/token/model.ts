import { z } from "zod";

export const accessTokenPayloadSchema = z.object({
  userId: z.string().describe("The ID of the authenticated user"),
});
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

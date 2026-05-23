import { z } from "zod";

export const authTokensSchema = z.object({
  accessToken: z.string().describe("Short-lived JWT for authenticating API requests"),
  refreshToken: z.string().describe("Long-lived opaque token for rotating access tokens"),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const meOutputSchema = z.object({
  id: z.string().describe("User's unique identifier"),
  fullName: z.string().describe("User's display name"),
  email: z.string().describe("User's email address"),
  emailVerified: z.boolean().describe("Whether the user has verified their email"),
  profileImageUrl: z.string().nullable().describe("URL to the user's profile picture, null if not set"),
  createdAt: z.date().describe("Timestamp when the user account was created"),
});
export type MeOutput = z.infer<typeof meOutputSchema>;

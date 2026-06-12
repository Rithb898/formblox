import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

/**
 * Verifies the access_token cookie using JWT_ACCESS_SECRET, matching the API.
 * Returns the userId, or null if the cookie is absent, invalid, or expired.
 */
export async function getUserIdFromCookies(): Promise<string | null> {
  // This route helper verifies the same server-side secret that the API issues with.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;

  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "object" && payload && typeof payload.userId === "string") {
      return payload.userId;
    }

    return null;
  } catch {
    return null;
  }
}

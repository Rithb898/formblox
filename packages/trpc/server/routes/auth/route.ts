import { z, zodUndefinedModel } from "../../schema";
import { userService, authService } from "../../services";
import { getAuthenticationMethodOutputSchema } from "@repo/services/user/model";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { TRPCError } from "@trpc/server";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, COOKIE_OPTS_ACCESS);
  res.cookie("refresh_token", refreshToken, COOKIE_OPTS_REFRESH);
}

function clearAuthCookies(res: any) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

function mapError(err: unknown): TRPCError {
  const msg = err instanceof Error ? err.message : "UNKNOWN_ERROR";
  const map: Record<string, { code: TRPCError["code"]; message: string }> = {
    EMAIL_TAKEN: { code: "CONFLICT", message: "Email already in use." },
    INVALID_CREDENTIALS: { code: "UNAUTHORIZED", message: "Invalid email or password." },
    EMAIL_NOT_VERIFIED: {
      code: "FORBIDDEN",
      message: "Please verify your email before logging in.",
    },
    INVALID_VERIFICATION_TOKEN: {
      code: "BAD_REQUEST",
      message: "Invalid or already used verification link.",
    },
    VERIFICATION_TOKEN_EXPIRED: {
      code: "BAD_REQUEST",
      message: "Verification link has expired. Please sign up again.",
    },
    INVALID_RESET_TOKEN: { code: "BAD_REQUEST", message: "Invalid or already used reset link." },
    RESET_TOKEN_EXPIRED: {
      code: "BAD_REQUEST",
      message: "Reset link has expired. Please request a new one.",
    },
    INVALID_REFRESH_TOKEN: {
      code: "UNAUTHORIZED",
      message: "Session invalid. Please log in again.",
    },
    REFRESH_TOKEN_EXPIRED: {
      code: "UNAUTHORIZED",
      message: "Session expired. Please log in again.",
    },
    REFRESH_TOKEN_REUSE_DETECTED: {
      code: "UNAUTHORIZED",
      message: "Security alert: please log in again.",
    },
    USER_NOT_FOUND: { code: "NOT_FOUND", message: "User not found." },
    GOOGLE_NO_EMAIL: { code: "BAD_REQUEST", message: "Google account has no email address." },
  };
  const mapped = map[msg];
  if (mapped) return new TRPCError(mapped);
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
}

const userOutputSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  emailVerified: z.boolean().nullable(),
  profileImageUrl: z.string().nullable(),
  createdAt: z.date().nullable(),
});

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      return userService.getAuthenticationMethods();
    }),

  signup: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signup"), tags: TAGS } })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().min(1).max(80),
      }),
    )
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await authService.signup(input.email, input.password, input.fullName);
      } catch (e) {
        throw mapError(e);
      }
    }),

  verifyEmail: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/verify-email"), tags: TAGS } })
    .input(z.object({ token: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { accessToken, refreshToken } = await authService.verifyEmail(input.token);
        setAuthCookies(ctx.res, accessToken, refreshToken);
        return { success: true };
      } catch (e) {
        throw mapError(e);
      }
    }),

  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { accessToken, refreshToken } = await authService.login(input.email, input.password);
        setAuthCookies(ctx.res, accessToken, refreshToken);
        return { success: true };
      } catch (e) {
        throw mapError(e);
      }
    }),

  logout: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/logout"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      const raw = ctx.req.cookies?.refresh_token as string | undefined;
      if (raw) await authService.logout(raw);
      clearAuthCookies(ctx.res);
      return { success: true };
    }),

  logoutAll: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/logout-all"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      await authService.logoutAll(ctx.userId);
      clearAuthCookies(ctx.res);
      return { success: true };
    }),

  refreshToken: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/refresh"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      const raw = ctx.req.cookies?.refresh_token as string | undefined;
      if (!raw) throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token." });
      try {
        const { accessToken, refreshToken } = await authService.refreshToken(raw);
        setAuthCookies(ctx.res, accessToken, refreshToken);
        return { success: true };
      } catch (e) {
        clearAuthCookies(ctx.res);
        throw mapError(e);
      }
    }),

  forgotPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/forgot-password"), tags: TAGS } })
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      await authService.forgotPassword(input.email);
      return { message: "If an account exists with that email, a reset link has been sent." };
    }),

  resetPassword: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/reset-password"), tags: TAGS } })
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await authService.resetPassword(input.token, input.newPassword);
        return { message: "Password reset successfully. Please log in." };
      } catch (e) {
        throw mapError(e);
      }
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(userOutputSchema)
    .query(async ({ ctx }) => {
      try {
        return await authService.me(ctx.userId);
      } catch (e) {
        throw mapError(e);
      }
    }),
});

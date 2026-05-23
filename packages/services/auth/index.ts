import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, eq, and, isNull } from "@repo/database";
import {
  usersTable,
  userCredentialsTable,
  oauthAccountsTable,
  emailVerificationTokensTable,
  passwordResetTokensTable,
  workspacesTable,
  workspaceMembersTable,
} from "@repo/database/schema";
import { googleOAuth2Client } from "../clients/google-oauth";
import { tokenService } from "../token";
import { emailService } from "../email";
import { type AuthTokens, type MeOutput } from "./model";

class AuthService {
  private async createPersonalWorkspace(userId: string, fullName: string): Promise<void> {
    const [workspace] = await db
      .insert(workspacesTable)
      .values({ name: `${fullName}'s Workspace`, createdBy: userId })
      .returning({ id: workspacesTable.id });
    await db.insert(workspaceMembersTable).values({ workspaceId: workspace!.id, userId, role: "owner" });
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = tokenService.createAccessToken(userId);
    const refreshToken = await tokenService.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  async signup(email: string, password: string, fullName: string): Promise<{ message: string }> {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) throw new Error("EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(password, 12);

    const insertedUsers = await db
      .insert(usersTable)
      .values({ email, fullName, emailVerified: false })
      .returning({ id: usersTable.id });

    const user = insertedUsers[0]!;

    await db.insert(userCredentialsTable).values({ userId: user.id, passwordHash });
    await this.createPersonalWorkspace(user.id, fullName);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailVerificationTokensTable).values({ userId: user.id, token, expiresAt });

    await emailService.sendVerificationEmail(email, token);
    return { message: "Check your email to verify your account." };
  }

  async verifyEmail(token: string): Promise<AuthTokens> {
    const [record] = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.token, token),
          isNull(emailVerificationTokensTable.usedAt),
        ),
      )
      .limit(1);

    if (!record) throw new Error("INVALID_VERIFICATION_TOKEN");
    if (record.expiresAt < new Date()) throw new Error("VERIFICATION_TOKEN_EXPIRED");

    await db
      .update(emailVerificationTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokensTable.id, record.id));

    await db
      .update(usersTable)
      .set({ emailVerified: true })
      .where(eq(usersTable.id, record.userId));

    return this.issueTokens(record.userId);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) throw new Error("INVALID_CREDENTIALS");
    if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

    const [credential] = await db
      .select()
      .from(userCredentialsTable)
      .where(eq(userCredentialsTable.userId, user.id))
      .limit(1);

    if (!credential) throw new Error("INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(password, credential.passwordHash);
    if (!valid) throw new Error("INVALID_CREDENTIALS");

    return this.issueTokens(user.id);
  }

  async googleCallback(code: string): Promise<AuthTokens> {
    const { tokens } = await googleOAuth2Client.getToken(code);
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload()!;
    const { sub, email, name, picture } = payload;

    if (!email) throw new Error("GOOGLE_NO_EMAIL");

    // Check existing OAuth account link
    const [oauthAccount] = await db
      .select()
      .from(oauthAccountsTable)
      .where(
        and(eq(oauthAccountsTable.provider, "GOOGLE"), eq(oauthAccountsTable.providerUserId, sub!)),
      )
      .limit(1);

    if (oauthAccount) {
      return this.issueTokens(oauthAccount.userId);
    }

    // Check existing user by email (auto-link)
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await db
        .update(usersTable)
        .set({ emailVerified: true, profileImageUrl: picture ?? existingUser.profileImageUrl })
        .where(eq(usersTable.id, userId));
    } else {
      const insertedNewUsers = await db
        .insert(usersTable)
        .values({
          email,
          fullName: name ?? email,
          emailVerified: true,
          profileImageUrl: picture,
        })
        .returning({ id: usersTable.id });
      userId = insertedNewUsers[0]!.id;
      await this.createPersonalWorkspace(userId, name ?? email);
    }

    await db.insert(oauthAccountsTable).values({
      userId,
      provider: "GOOGLE",
      providerUserId: sub!,
      accessToken: tokens.access_token,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    return this.issueTokens(userId);
  }

  async refreshToken(raw: string): Promise<AuthTokens> {
    const { userId, newRaw } = await tokenService.rotateRefreshToken(raw);
    const accessToken = tokenService.createAccessToken(userId);
    return { accessToken, refreshToken: newRaw };
  }

  async logout(raw: string): Promise<void> {
    await tokenService.revokeRefreshToken(raw);
  }

  async logoutAll(userId: string): Promise<void> {
    await tokenService.revokeAllRefreshTokens(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    // Silent return to prevent email enumeration
    if (!user) return;

    // Invalidate existing reset tokens
    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(
        and(eq(passwordResetTokensTable.userId, user.id), isNull(passwordResetTokensTable.usedAt)),
      );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });

    await emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const [record] = await db
      .select()
      .from(passwordResetTokensTable)
      .where(
        and(eq(passwordResetTokensTable.token, token), isNull(passwordResetTokensTable.usedAt)),
      )
      .limit(1);

    if (!record) throw new Error("INVALID_RESET_TOKEN");
    if (record.expiresAt < new Date()) throw new Error("RESET_TOKEN_EXPIRED");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Upsert credential
    const [existing] = await db
      .select({ id: userCredentialsTable.id })
      .from(userCredentialsTable)
      .where(eq(userCredentialsTable.userId, record.userId))
      .limit(1);

    if (existing) {
      await db
        .update(userCredentialsTable)
        .set({ passwordHash })
        .where(eq(userCredentialsTable.id, existing.id));
    } else {
      await db.insert(userCredentialsTable).values({ userId: record.userId, passwordHash });
    }

    await db
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, record.id));

    // Force re-login everywhere
    await tokenService.revokeAllRefreshTokens(record.userId);
  }

  async me(userId: string): Promise<MeOutput> {
    const [user] = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        emailVerified: usersTable.emailVerified,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }
}

export const authService = new AuthService();

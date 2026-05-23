import { Resend } from "resend";
import { env } from "../env";

const resend = new Resend(env.RESEND_API_KEY);

class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await resend.emails.send({
      from: "noreply@formblox.com",
      to,
      subject: "Verify your email address",
      html: `<p>Click <a href="${link}">here</a> to verify your email. This link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: "noreply@formblox.com",
      to,
      subject: "Reset your password",
      html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }
}

export const emailService = new EmailService();

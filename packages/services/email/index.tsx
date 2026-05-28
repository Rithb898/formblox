import React from "react";
import { Resend } from "resend";
import { env } from "../env";
import VerifyEmail from "./templates/verify-email";
import ResetPassword from "./templates/reset-password";
import NewResponseEmail from "./templates/new-response";

const resend = new Resend(env.RESEND_API_KEY);

class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await resend.emails.send({
      from: "noreply@rithbanerjee.site",
      to,
      subject: "Verify your email address",
      react: <VerifyEmail link={link} />,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: "noreply@rithbanerjee.site",
      to,
      subject: "Reset your password",
      react: <ResetPassword link={link} />,
    });
  }

  async sendNewResponseEmail(params: {
    ownerEmail: string;
    formTitle: string;
    formId: string;
    responseCount: number;
  }): Promise<void> {
    const responsesUrl = `${env.FRONTEND_URL}/forms/${params.formId}/responses`;
    await resend.emails.send({
      from: "noreply@rithbanerjee.site",
      to: params.ownerEmail,
      subject: `New response on "${params.formTitle}"`,
      react: (
        <NewResponseEmail
          formTitle={params.formTitle}
          responseCount={params.responseCount}
          responsesUrl={responsesUrl}
        />
      ),
    });
  }
}

export const emailService = new EmailService();

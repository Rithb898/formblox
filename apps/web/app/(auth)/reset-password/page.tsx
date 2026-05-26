"use client";

import Link from "next/link";
import { useResetPasswordForm } from "~/hooks/auth";
import { Button } from "~/components/ui/button";
import { PasswordInput } from "~/components/ui/password-input";
import { Field, FieldLabel, FieldError } from "~/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const bezelClass =
  "animate-fade-up rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]";
const cardClass =
  "gap-6 rounded-[1.4rem] border-0 bg-[#111] py-7 text-[#F2F2F2] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04]";
const inputClass =
  "h-10 rounded-lg border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder:text-[#6B6B6B] shadow-none transition-[color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:border-[#E8854A]/40 focus-visible:ring-[3px] focus-visible:ring-[#E8854A]/40 dark:bg-white/[0.03]";
const primaryBtnClass =
  "h-10 rounded-full bg-[#E8854A] font-semibold text-[#0a0a0a] shadow-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#E8854A] hover:brightness-110 active:scale-[0.98]";
const outlineBtnClass =
  "h-10 rounded-full border-0 bg-white/[0.04] text-[#F2F2F2] shadow-none ring-1 ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.07] hover:text-[#F2F2F2] active:scale-[0.98] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]";
const backLinkClass =
  "text-sm text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#E8854A]";

import { Suspense } from "react";

function ResetPasswordContent() {
  const { token, register, errors, onSubmit, isPending, formError } = useResetPasswordForm();

  if (!token) {
    return (
      <div className={bezelClass}>
        <Card className={cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="tracking-tight">Invalid link</CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              This reset link is missing a token.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/forgot-password">
              <Button variant="outline" className={outlineBtnClass}>
                Request a new link
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={bezelClass}>
      <Card className={cardClass}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-tight">Reset password</CardTitle>
          <CardDescription className="text-[#6B6B6B]">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={!!errors.newPassword}>
                <FieldLabel>New password</FieldLabel>
                <PasswordInput
                  id="newPassword"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("newPassword")}
                />
                <FieldError>{errors.newPassword?.message}</FieldError>
              </Field>

              <Field invalid={!!errors.confirmPassword}>
                <FieldLabel>Confirm password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("confirmPassword")}
                />
                <FieldError>{errors.confirmPassword?.message}</FieldError>
              </Field>
            </div>
            <p className="text-xs text-[#6B6B6B]">Must be at least 8 characters long.</p>

            {formError && (
              <p role="alert" className="rounded-lg border border-[#E8854A]/30 bg-[#E8854A]/[0.08] px-3 py-2 text-xs text-[#E8854A]">
                {formError}
              </p>
            )}
            <Button type="submit" className={`w-full ${primaryBtnClass}`} disabled={isPending}>
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className={backLinkClass}>
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={bezelClass}>
          <Card className={`${cardClass} min-h-[340px] flex flex-col items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
              <span className="size-6 animate-spin rounded-full border-2 border-[#E8854A] border-t-transparent" />
              <p className="text-sm text-[#6B6B6B]">Preparing secure reset form...</p>
            </div>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

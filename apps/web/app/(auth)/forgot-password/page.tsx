"use client";

import Link from "next/link";
import { useForgotPasswordForm } from "~/hooks/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
const backLinkClass =
  "text-sm text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#E8854A]";

export default function ForgotPasswordPage() {
  const { register, errors, onSubmit, isPending, done, formError } = useForgotPasswordForm();

  if (done) {
    return (
      <div className={bezelClass}>
        <Card className={cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl tracking-tight">Check your email</CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              If an account exists with that email, a password reset link has been sent.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/login" className={backLinkClass}>
              Back to sign in
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
          <CardTitle className="text-2xl tracking-tight">Forgot password</CardTitle>
          <CardDescription className="text-[#6B6B6B]">
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field invalid={!!errors.email}>
              <FieldLabel>Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                className={inputClass}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>

            {formError && (
              <p role="alert" className="rounded-lg border border-[#E8854A]/30 bg-[#E8854A]/[0.08] px-3 py-2 text-xs text-[#E8854A]">
                {formError}
              </p>
            )}
            <Button type="submit" className={`w-full ${primaryBtnClass}`} disabled={isPending}>
              {isPending ? "Sending..." : "Send reset link"}
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

"use client";

import Link from "next/link";
import { useSignupForm } from "~/hooks/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Field, FieldLabel, FieldDescription, FieldError } from "~/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { IconBrandGoogle } from "@tabler/icons-react";

const bezelClass =
  "animate-fade-up rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]";
const cardClass =
  "gap-6 rounded-[1.4rem] border-0 bg-[#111] py-7 text-[#F2F2F2] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04]";
const inputClass =
  "h-10 rounded-lg border-white/[0.08] bg-white/[0.03] text-[#F2F2F2] placeholder:text-[#6B6B6B] shadow-none transition-[color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:border-[#E8854A]/40 focus-visible:ring-[3px] focus-visible:ring-[#E8854A]/40 dark:bg-white/[0.03]";
const primaryBtnClass =
  "h-10 rounded-full bg-[#E8854A] font-semibold text-[#0a0a0a] shadow-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#E8854A] hover:brightness-110 active:scale-[0.98]";
const socialBtnClass =
  "h-10 rounded-full border-0 bg-white/[0.04] text-[#F2F2F2] shadow-none ring-1 ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.07] hover:text-[#F2F2F2] active:scale-[0.98] disabled:opacity-40 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]";

export default function SignupPage() {
  const { register, errors, onSubmit, isPending, done, formError, googleOAuthUrl } =
    useSignupForm();

  if (done) {
    return (
      <div className={bezelClass}>
        <Card className={cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl tracking-tight">Check your email</CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              We sent a verification link to your inbox. Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link
              href="/login"
              className="text-sm text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#E8854A]"
            >
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
          <CardTitle className="text-2xl tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-[#6B6B6B]">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field invalid={!!errors.fullName}>
              <FieldLabel>Full name</FieldLabel>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                autoComplete="name"
                className={inputClass}
                {...register("fullName")}
              />
              <FieldError>{errors.fullName?.message}</FieldError>
            </Field>

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
              <FieldDescription className="text-[#6B6B6B]">
                We&apos;ll use this to contact you. We will not share your email with anyone else.
              </FieldDescription>
              <FieldError>{errors.email?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field invalid={!!errors.password}>
                <FieldLabel>Password</FieldLabel>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("password")}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>

              <Field invalid={!!errors.confirmPassword}>
                <FieldLabel>Confirm Password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                  {...register("confirmPassword")}
                />
                <FieldError>{errors.confirmPassword?.message}</FieldError>
              </Field>
            </div>
            <p className="text-xs text-[#6B6B6B]">Must be at least 8 characters long.</p>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-[#E8854A]/30 bg-[#E8854A]/[0.08] px-3 py-2 text-xs text-[#E8854A]"
              >
                {formError}
              </p>
            )}
            <Button type="submit" className={`w-full ${primaryBtnClass}`} disabled={isPending}>
              {isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111] px-2 text-[#6B6B6B]">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" asChild className={`w-full ${socialBtnClass}`}>
            <a href={googleOAuthUrl}>
              <IconBrandGoogle aria-hidden="true" />
              Continue with Google
            </a>
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-[#6B6B6B]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#F2F2F2] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#E8854A]"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

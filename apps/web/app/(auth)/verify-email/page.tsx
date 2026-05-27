"use client";

import Link from "next/link";
import { useVerifyEmail } from "~/hooks/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { IconLoader2, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";

const bezelClass =
  "animate-fade-up rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]";
const cardClass =
  "gap-6 rounded-[1.4rem] border-0 bg-[#111] py-7 text-[#F2F2F2] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04]";
const outlineBtnClass =
  "h-10 rounded-full border-0 bg-white/[0.04] text-[#F2F2F2] shadow-none ring-1 ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.07] hover:text-[#F2F2F2] active:scale-[0.98] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]";

import { Suspense } from "react";

function VerifyEmailContent() {
  const { token, isPending, isSuccess, isError, error } = useVerifyEmail();

  if (!token) {
    return (
      <div className={bezelClass}>
        <Card className={cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="tracking-tight">Invalid link</CardTitle>
            <CardDescription className="text-[#6B6B6B]">
              This verification link is missing a token.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/signup">
              <Button variant="outline" className={outlineBtnClass}>
                Back to sign up
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
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            {isPending && (
              <span className="flex size-12 items-center justify-center rounded-full bg-[#E8854A]/10 ring-1 ring-[#E8854A]/20">
                <IconLoader2 className="size-6 animate-spin text-[#E8854A]" aria-hidden="true" />
              </span>
            )}
            {isSuccess && (
              <span className="flex size-12 items-center justify-center rounded-full bg-[#E8854A]/10 ring-1 ring-[#E8854A]/20">
                <IconCircleCheck className="size-6 text-[#E8854A]" aria-hidden="true" />
              </span>
            )}
            {isError && (
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                <IconAlertCircle
                  className="size-6 text-destructive-foreground"
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {isPending && "Verifying your email..."}
            {isSuccess && "Email verified!"}
            {isError && "Verification failed"}
          </CardTitle>
          <CardDescription className="text-[#6B6B6B]">
            {isPending && "Please wait a moment."}
            {isSuccess && "Redirecting you to your forms..."}
            {isError && error?.message}
          </CardDescription>
        </CardHeader>
        {isError && (
          <CardContent>
            <Link href="/signup">
              <Button variant="outline" className={`w-full ${outlineBtnClass}`}>
                Back to sign up
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={bezelClass}>
          <Card className={`${cardClass} min-h-[220px] flex flex-col items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
              <span className="size-6 animate-spin rounded-full border-2 border-[#E8854A] border-t-transparent" />
              <p className="text-sm text-[#6B6B6B]">Preparing email verification...</p>
            </div>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

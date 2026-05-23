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

export default function VerifyEmailPage() {
  const { token, isPending, isSuccess, isError, error } = useVerifyEmail();

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This verification link is missing a token.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/signup">
            <Button variant="outline">Back to sign up</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {isPending && "Verifying your email..."}
          {isSuccess && "Email verified!"}
          {isError && "Verification failed"}
        </CardTitle>
        <CardDescription>
          {isPending && "Please wait a moment."}
          {isSuccess && "Redirecting you to your forms..."}
          {isError && error?.message}
        </CardDescription>
      </CardHeader>
      {isError && (
        <CardContent>
          <Link href="/signup">
            <Button variant="outline" className="w-full">
              Back to sign up
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

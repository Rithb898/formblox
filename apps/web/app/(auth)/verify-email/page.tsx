"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/client";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const called = useRef(false);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setTimeout(() => router.push("/dashboard"), 2000);
    },
  });

  useEffect(() => {
    if (token && !called.current) {
      called.current = true;
      verifyMutation.mutate({ token });
    }
  }, [token]);

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
          {verifyMutation.isPending && "Verifying your email..."}
          {verifyMutation.isSuccess && "Email verified!"}
          {verifyMutation.isError && "Verification failed"}
        </CardTitle>
        <CardDescription>
          {verifyMutation.isPending && "Please wait a moment."}
          {verifyMutation.isSuccess && "Redirecting you to the dashboard..."}
          {verifyMutation.isError && verifyMutation.error.message}
        </CardDescription>
      </CardHeader>
      {verifyMutation.isError && (
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

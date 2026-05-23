"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";

export function useVerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const called = useRef(false);

  const mutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setTimeout(() => router.push("/forms"), 2000);
    },
  });

  useEffect(() => {
    if (token && !called.current) {
      called.current = true;
      mutation.mutate({ token });
    }
  }, [token]);

  return {
    token,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}

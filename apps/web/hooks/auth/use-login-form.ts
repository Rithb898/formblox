"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { env } from "~/env.js";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof schema>;

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "rate_limited") {
      toast.error("Too many attempts. Please wait 15 minutes and try again.");
      router.replace("/login");
    } else if (error === "oauth_failed") {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/login");
    }
  }, [searchParams, router]);

  const mutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.reset();
      router.push("/forms");
    },
    onError: (err) => {
      toast.error(err.message);
      setFormError(err.message);
    },
  });

  const form = useForm<LoginFormData>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit((data) => {
    setFormError(null);
    mutation.mutate(data);
  });

  const googleOAuthUrl = env.NEXT_PUBLIC_API_URL
    ? `${env.NEXT_PUBLIC_API_URL}/auth/google`
    : "/auth/google";

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isPending: mutation.isPending,
    formError,
    googleOAuthUrl,
  };
}

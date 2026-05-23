"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { env } from "~/env.js";

const schema = z
  .object({
    fullName: z.string().min(1, "Name is required").max(80),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof schema>;

export function useSignupForm() {
  const [done, setDone] = useState(false);

  const mutation = trpc.auth.signup.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<SignupFormData>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(({ fullName, email, password }) =>
    mutation.mutate({ fullName, email, password }),
  );

  const googleOAuthUrl = env.NEXT_PUBLIC_API_URL
    ? `${env.NEXT_PUBLIC_API_URL}/auth/google`
    : "/auth/google";

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isPending: mutation.isPending,
    done,
    googleOAuthUrl,
  };
}

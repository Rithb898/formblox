"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof schema>;

export function useResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successfully. Please sign in.");
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message);
      setFormError(err.message);
    },
  });

  const form = useForm<ResetPasswordFormData>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(({ newPassword }) => {
    if (!token) return;
    setFormError(null);
    mutation.mutate({ token, newPassword });
  });

  return {
    token,
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isPending: mutation.isPending,
    formError,
  };
}

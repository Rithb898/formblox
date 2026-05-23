"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";

const schema = z.object({ email: z.string().email("Invalid email address") });

export type ForgotPasswordFormData = z.infer<typeof schema>;

export function useForgotPasswordForm() {
  const [done, setDone] = useState(false);

  const mutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message),
  });

  const form = useForm<ForgotPasswordFormData>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data));

  return {
    register: form.register,
    errors: form.formState.errors,
    onSubmit,
    isPending: mutation.isPending,
    done,
  };
}

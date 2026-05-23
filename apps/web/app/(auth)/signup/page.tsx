"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
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
import { IconBrandApple, IconBrandGoogle, IconBrandMeta } from "@tabler/icons-react";
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
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [done, setDone] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = ({ fullName, email, password }: FormData) =>
    signupMutation.mutate({ fullName, email, password });

  const googleSignupUrl = env.NEXT_PUBLIC_API_URL
    ? `${env.NEXT_PUBLIC_API_URL}/auth/google`
    : "/auth/google";

  if (done) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to your inbox. Click it to activate your account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Enter your email below to create your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field invalid={!!errors.fullName}>
            <FieldLabel>Full name</FieldLabel>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              autoComplete="name"
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
              {...register("email")}
            />
            <FieldDescription>
              We&apos;ll use this to contact you. We will not share your email with anyone else.
            </FieldDescription>
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field invalid={!!errors.password}>
              <FieldLabel>Password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...register("password")}
              />
              <FieldError>{errors.password?.message}</FieldError>
            </Field>

            <Field invalid={!!errors.confirmPassword}>
              <FieldLabel>Confirm Password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <FieldError>{errors.confirmPassword?.message}</FieldError>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>

          <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
            {signupMutation.isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" type="button" disabled aria-label="Continue with Apple">
            <IconBrandApple aria-hidden="true" />
          </Button>
          <Button variant="outline" type="button" asChild aria-label="Continue with Google">
            <a href={googleSignupUrl}>
              <IconBrandGoogle aria-hidden="true" />
            </a>
          </Button>
          <Button variant="outline" type="button" disabled aria-label="Continue with Meta">
            <IconBrandMeta aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

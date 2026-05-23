"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Field, FieldLabel, FieldError } from "~/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { env } from "~/env.js";
import { IconBrandGoogle } from "@tabler/icons-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();

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

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.reset();
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => loginMutation.mutate(data);

  const googleLoginUrl = env.NEXT_PUBLIC_API_URL
    ? `${env.NEXT_PUBLIC_API_URL}/auth/google`
    : "/auth/google";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Login to your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field invalid={!!errors.email}>
            <FieldLabel>
              Email <span className="text-destructive-foreground">*</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoComplete="email"
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field invalid={!!errors.password}>
            <div className="flex w-full items-center justify-between">
              <FieldLabel>Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Login"}
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

        <Button variant="outline" type="button" className="w-full" asChild>
          <a href={googleLoginUrl}>
            <IconBrandGoogle aria-hidden="true" />
            Continue with Google
          </a>
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

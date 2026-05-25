"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { buildResponseSchema, type FieldType } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

type Field = {
  id: string;
  order: number;
  type: string;
  label: string;
  required: boolean;
  config: Record<string, unknown>;
};

type Props = {
  slug: string;
  title: string;
  description: string | null;
  fields: Field[];
};

type FieldInputProps = {
  field: Field;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  error?: string;
};

function ShortTextInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = (field.config.maxLength as number | undefined);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      </Label>
      <Input
        id={field.id}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn("w-full", error && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.id}-error` : undefined}
        aria-required={field.required}
        {...registration}
      />
      {error && (
        <p id={`${field.id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function LongTextInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = (field.config.maxLength as number | undefined);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      </Label>
      <Textarea
        id={field.id}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className={cn("w-full resize-none", error && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.id}-error` : undefined}
        aria-required={field.required}
        {...registration}
      />
      {error && (
        <p id={`${field.id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ThankYou() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
        <svg className="size-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">Thanks for your response!</p>
        <p className="text-sm text-muted-foreground">Your submission has been recorded.</p>
      </div>
    </div>
  );
}

const FRIENDLY_ERRORS: Record<string, string> = {
  rate_limited: "Too many submissions. Please wait a moment and try again.",
  not_accepting_responses: "This form is no longer accepting responses.",
  not_published: "This form is no longer accepting responses.",
};

export function FormRunner({ slug, title, description, fields }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(
    () =>
      buildResponseSchema(
        fields.map((f) => ({ id: f.id, type: f.type as FieldType, required: f.required, config: f.config }))
      ),
    [fields]
  );

  const defaultValues = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.id, ""])),
    [fields]
  );

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submit = trpc.forms.public.submit.useMutation();

  const onSubmit = form.handleSubmit(async (values) => {
    setBannerError(null);
    try {
      await submit.mutateAsync({
        slug,
        answers: values,
        _gotcha: honeypotRef.current?.value ?? "",
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setBannerError(
        FRIENDLY_ERRORS[msg] ?? "Something went wrong. Please try again."
      );
    }
  });

  if (submitted) return <ThankYou />;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit} noValidate>
      {/* Header */}
      <div className={cn("flex flex-col gap-2", description && "pb-2")}>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Form-level error banner */}
      {bannerError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {bannerError}
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col gap-6">
        {fields.map((field) => {
          const error = form.formState.errors[field.id]?.message as string | undefined;
          const registration = form.register(field.id);
          if (field.type === "short_text")
            return <ShortTextInput key={field.id} field={field} registration={registration} error={error} />;
          if (field.type === "long_text")
            return <LongTextInput key={field.id} field={field} registration={registration} error={error} />;
          return null;
        })}
      </div>

      {/* Honeypot — NOT registered with RHF */}
      <input
        ref={honeypotRef}
        type="text"
        name="_gotcha"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <Button
        type="submit"
        className="self-start"
        disabled={submit.isPending}
        aria-disabled={submit.isPending}
      >
        {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
        {submit.isPending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useForm, useController, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";
import { buildResponseSchema, type FieldType } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { RadioGroup, Radio } from "~/components/ui/radio-group";
import { CheckboxGroup } from "~/components/ui/checkbox-group";
import { Checkbox } from "~/components/ui/checkbox";
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

type ControlledFieldProps = {
  field: Field;
  control: Control<Record<string, unknown>>;
  error?: string;
};

function FieldLabel({ field }: { field: Field }) {
  return (
    <Label htmlFor={field.id} className="text-sm font-medium">
      {field.label}
      {field.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
    </Label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );
}

function ShortTextInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = field.config.maxLength as number | undefined;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel field={field} />
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
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function LongTextInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = field.config.maxLength as number | undefined;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel field={field} />
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
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function EmailInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel field={field} />
      <Input
        id={field.id}
        type="email"
        placeholder={placeholder}
        className={cn("w-full", error && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.id}-error` : undefined}
        aria-required={field.required}
        {...registration}
      />
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function NumberInput({ field, registration, error }: FieldInputProps) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const min = field.config.min as number | undefined;
  const max = field.config.max as number | undefined;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel field={field} />
      <Input
        id={field.id}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn("w-full", error && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.id}-error` : undefined}
        aria-required={field.required}
        {...registration}
      />
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function DateInput({ field, registration, error }: FieldInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel field={field} />
      <Input
        id={field.id}
        type="date"
        className={cn("w-full", error && "border-destructive focus-visible:ring-destructive")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${field.id}-error` : undefined}
        aria-required={field.required}
        {...registration}
      />
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function SingleChoiceInput({ field, control, error }: ControlledFieldProps) {
  const { field: ctrl } = useController({ name: field.id, control });
  const options = (field.config.options as Array<{ id: string; label: string }>) ?? [];
  return (
    <div className="flex flex-col gap-3" role="group" aria-labelledby={`${field.id}-label`}>
      <Label id={`${field.id}-label`} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      </Label>
      <RadioGroup
        value={(ctrl.value as string) ?? ""}
        onValueChange={ctrl.onChange}
        aria-required={field.required}
        aria-describedby={error ? `${field.id}-error` : undefined}
      >
        {options.map((opt) => (
          <Label key={opt.id} className="flex cursor-pointer items-center gap-2.5 font-normal">
            <Radio value={opt.id} />
            {opt.label}
          </Label>
        ))}
      </RadioGroup>
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function MultipleChoiceInput({ field, control, error }: ControlledFieldProps) {
  const { field: ctrl } = useController({ name: field.id, control });
  const options = (field.config.options as Array<{ id: string; label: string }>) ?? [];
  const value = (ctrl.value as string[]) ?? [];
  return (
    <div className="flex flex-col gap-3" role="group" aria-labelledby={`${field.id}-label`}>
      <Label id={`${field.id}-label`} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      </Label>
      <CheckboxGroup
        value={value}
        onValueChange={ctrl.onChange}
        aria-required={field.required}
        aria-describedby={error ? `${field.id}-error` : undefined}
      >
        {options.map((opt) => (
          <Label key={opt.id} className="flex cursor-pointer items-center gap-2.5 font-normal">
            <Checkbox value={opt.id} />
            {opt.label}
          </Label>
        ))}
      </CheckboxGroup>
      <FieldError id={field.id} error={error} />
    </div>
  );
}

function RatingInput({ field, control, error }: ControlledFieldProps) {
  const { field: ctrl } = useController({ name: field.id, control });
  const scale = (field.config.scale as number) ?? 5;
  const style = (field.config.style as "star" | "number") ?? "star";
  const value = (ctrl.value as number) ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <FieldLabel field={field} />
      <div className="flex gap-1" role="group" aria-label={`Rating out of ${scale}`}>
        {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => ctrl.onChange(n === value ? 0 : n)}
            aria-label={`${n} out of ${scale}`}
            aria-pressed={n === value}
            className={cn(
              "flex size-9 items-center justify-center rounded-md border transition-all",
              n <= value
                ? "border-orange-400/40 bg-orange-400/10 text-orange-400"
                : "border-border bg-background text-muted-foreground hover:border-orange-400/30 hover:text-orange-400/70",
            )}
          >
            {style === "star" ? (
              <Star className={cn("size-4", n <= value && "fill-orange-400")} />
            ) : (
              <span className="text-sm font-medium">{n}</span>
            )}
          </button>
        ))}
      </div>
      <FieldError id={field.id} error={error} />
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
        fields.map((f) => ({ id: f.id, type: f.type as FieldType, required: f.required, config: f.config })),
      ),
    [fields],
  );

  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((f) => [f.id, f.type === "multiple_choice" ? [] : ""]),
      ),
    [fields],
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
      setBannerError(FRIENDLY_ERRORS[msg] ?? "Something went wrong. Please try again.");
    }
  });

  if (submitted) return <ThankYou />;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit} noValidate>
      <div className={cn("flex flex-col gap-2", description && "pb-2")}>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {bannerError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {bannerError}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {fields.map((field) => {
          const error = form.formState.errors[field.id]?.message as string | undefined;

          if (field.type === "short_text")
            return <ShortTextInput key={field.id} field={field} registration={form.register(field.id)} error={error} />;
          if (field.type === "long_text")
            return <LongTextInput key={field.id} field={field} registration={form.register(field.id)} error={error} />;
          if (field.type === "email")
            return <EmailInput key={field.id} field={field} registration={form.register(field.id)} error={error} />;
          if (field.type === "number")
            return <NumberInput key={field.id} field={field} registration={form.register(field.id, { valueAsNumber: true })} error={error} />;
          if (field.type === "date")
            return <DateInput key={field.id} field={field} registration={form.register(field.id)} error={error} />;
          if (field.type === "single_choice")
            return <SingleChoiceInput key={field.id} field={field} control={form.control} error={error} />;
          if (field.type === "multiple_choice")
            return <MultipleChoiceInput key={field.id} field={field} control={form.control} error={error} />;
          if (field.type === "rating")
            return <RatingInput key={field.id} field={field} control={form.control} error={error} />;
          return null;
        })}
      </div>

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

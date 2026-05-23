"use client";

import { useState } from "react";
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
  title: string;
  description: string | null;
  fields: Field[];
};

function ShortTextInput({ field }: { field: Field }) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = (field.config.maxLength as number | undefined);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        id={field.id}
        name={field.id}
        placeholder={placeholder}
        maxLength={maxLength}
        required={field.required}
        className="w-full"
      />
    </div>
  );
}

function LongTextInput({ field }: { field: Field }) {
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = (field.config.maxLength as number | undefined);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Textarea
        id={field.id}
        name={field.id}
        placeholder={placeholder}
        maxLength={maxLength}
        required={field.required}
        rows={4}
        className="w-full resize-none"
      />
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

export function FormRunner({ title, description, fields }: Props) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <ThankYou />;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        // Slice 2 wires up actual submission
        setSubmitted(true);
      }}
    >
      {/* Header */}
      <div className={cn("flex flex-col gap-2", description && "pb-2")}>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-6">
        {fields.map((field) => {
          if (field.type === "short_text") return <ShortTextInput key={field.id} field={field} />;
          if (field.type === "long_text") return <LongTextInput key={field.id} field={field} />;
          return null;
        })}
      </div>

      {/* Honeypot */}
      <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />

      <Button type="submit" className="self-start">
        Submit
      </Button>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Check, Loader2, Star } from "lucide-react";
import { buildResponseSchema, zodForField, type FieldType } from "@repo/forms";
import { trpc } from "~/trpc/client";
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

const FRIENDLY_ERRORS: Record<string, string> = {
  rate_limited: "Too many submissions. Please wait a moment and try again.",
  not_accepting_responses: "This form is no longer accepting responses.",
  not_published: "This form is no longer accepting responses.",
};

const TYPING_MS = 600;

type ChoiceOption = { id: string; label: string };

function optionsOf(field: Field): ChoiceOption[] {
  return (field.config.options as ChoiceOption[] | undefined) ?? [];
}

// Render a human-readable summary of an answer for the history bubble.
function formatAnswer(field: Field, value: unknown): string {
  if (field.type === "single_choice") {
    return optionsOf(field).find((o) => o.id === value)?.label ?? "";
  }
  if (field.type === "multiple_choice") {
    const ids = (value as string[] | undefined) ?? [];
    const labels = optionsOf(field);
    return ids
      .map((id) => labels.find((o) => o.id === id)?.label ?? id)
      .join(", ");
  }
  if (field.type === "rating") {
    const n = Number(value) || 0;
    const style = (field.config.style as "star" | "number") ?? "star";
    if (style === "star") return "★".repeat(n);
    return `${n}`;
  }
  return value == null ? "" : String(value);
}

function Avatar({ initial }: { initial: string }) {
  return (
    <div
      aria-hidden="true"
      className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-[#E8854A] text-[13px] font-semibold text-[#0a0a0a]"
    >
      {initial}
    </div>
  );
}

function TypingIndicator({ initial }: { initial: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <Avatar initial={initial} />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-[#6B6B6B] animate-typing-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionBubble({
  field,
  initial,
  faded,
}: {
  field: Field;
  initial: string;
  faded: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-end gap-2.5 animate-bubble-in-left",
        faded && "opacity-60",
      )}
    >
      <Avatar initial={initial} />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        {field.label}
        {field.required && (
          <span className="ml-1 text-[#E8854A]" aria-hidden="true">
            *
          </span>
        )}
      </div>
    </div>
  );
}

function AnswerBubble({ text, faded }: { text: string; faded: boolean }) {
  return (
    <div
      className={cn(
        "flex justify-end animate-bubble-in-right",
        faded && "opacity-60",
      )}
    >
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#E8854A] px-4 py-3 text-[15px] leading-relaxed text-[#0a0a0a]">
        {text || "—"}
      </div>
    </div>
  );
}

// AI follow-up bubble — future feature, component built per spec.
export function AiFollowUpBubble({ text }: { text: string }) {
  return (
    <div className="flex animate-bubble-in-left">
      <div className="max-w-[80%] rounded-2xl border-l-2 border-[#E8854A] bg-[#1a1a1a] px-4 py-3">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#E8854A]">
          AI
        </span>
        <p className="text-[15px] leading-relaxed text-[#F2F2F2]">{text}</p>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8854A]">
        <Check className="size-4 text-[#0a0a0a]" aria-hidden="true" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        Thanks — we got it.
      </div>
    </div>
  );
}

export function FormRunner({ slug, title, description, fields }: Props) {
  const ordered = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  );

  const initial = (title.trim()[0] ?? "F").toUpperCase();

  const [submitted, setSubmitted] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  // index of the question currently being asked (answered count == step)
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const schema = useMemo(
    () =>
      buildResponseSchema(
        ordered.map((f) => ({
          id: f.id,
          type: f.type as FieldType,
          required: f.required,
          config: f.config,
        })),
      ),
    [ordered],
  );

  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        ordered.map((f) => [f.id, f.type === "multiple_choice" ? [] : ""]),
      ),
    [ordered],
  );

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submit = trpc.forms.public.submit.useMutation();

  const total = ordered.length;
  const current = ordered[step];

  // Show typing indicator briefly before each new question enters.
  useEffect(() => {
    if (step >= total) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), TYPING_MS);
    return () => clearTimeout(t);
  }, [step, total]);

  // Auto-scroll to newest bubble.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, typing, submitted]);

  // Validate just the current field's value using its own zod schema, then advance.
  function validateAndAdvance(rawValue: unknown) {
    if (typing) return;
    if (!current) return;
    setFieldError(null);

    const validator = zodForField({
      id: current.id,
      type: current.type as FieldType,
      required: current.required,
      config: current.config,
    });

    // Coerce empty values so required fields fail; numbers come in as numbers.
    let value = rawValue;
    if (typeof value === "string" && value.trim() === "") value = undefined;
    if (current.type === "number" && typeof value === "string") {
      value = value === "" ? undefined : Number(value);
    }

    const result = validator.safeParse(value);
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Invalid answer");
      return;
    }

    form.setValue(current.id, value === undefined ? "" : value);

    if (step + 1 >= total) {
      void finalize();
      return;
    }
    setStep((s) => s + 1);
  }

  async function finalize() {
    setBannerError(null);
    const values = form.getValues();
    try {
      await submit.mutateAsync({
        slug,
        answers: values,
        _gotcha: honeypotRef.current?.value ?? "",
      });
      setStep(total);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setBannerError(
        FRIENDLY_ERRORS[msg] ?? "Something went wrong. Please try again.",
      );
    }
  }

  const progressPct = total === 0 ? 100 : (step / total) * 100;
  const counter = `${String(Math.min(step + (submitted ? 0 : 1), total)).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#080808] text-[#F2F2F2]">
      {/* radial amber glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(232,133,74,0.10), transparent 70%)",
        }}
      />

      {/* Sticky glass header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#080808]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
          <h1 className="truncate text-sm font-semibold tracking-tight text-[#F2F2F2]">
            {title}
          </h1>
          <span className="shrink-0 font-mono text-xs text-[#6B6B6B]">
            {counter}
          </span>
        </div>
        <div className="h-[2px] w-full bg-white/[0.04]">
          <div
            className="h-full bg-[#E8854A] transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Chat thread */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
          {description && (
            <p className="text-sm leading-relaxed text-[#6B6B6B]">
              {description}
            </p>
          )}

          {bannerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-xl border border-[#E8854A]/40 bg-[#E8854A]/10 px-4 py-3 text-sm text-[#E8854A]"
            >
              {bannerError}
            </div>
          )}

          {ordered.map((field, i) => {
            if (i > step) return null;
            const answered = i < step;
            return (
              <div key={field.id} className="flex flex-col gap-5">
                <QuestionBubble
                  field={field}
                  initial={initial}
                  faded={answered}
                />
                {answered && (
                  <AnswerBubble
                    text={formatAnswer(field, form.getValues(field.id))}
                    faded
                  />
                )}
              </div>
            );
          })}

          {!submitted && typing && step < total && (
            <TypingIndicator initial={initial} />
          )}

          {submitted && <SuccessState />}

          <div ref={threadEndRef} />
        </div>
      </main>

      {/* Sticky reply area */}
      {!submitted && current && (
        <footer className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-4">
            {fieldError && (
              <p
                role="alert"
                className="mb-2 text-xs font-medium text-[#E8854A]"
              >
                {fieldError}
              </p>
            )}
            <ReplyArea
              key={current.id}
              field={current}
              disabled={typing || submit.isPending}
              pending={submit.isPending}
              onSubmit={validateAndAdvance}
            />
          </div>
        </footer>
      )}

      {/* Honeypot */}
      <input
        ref={honeypotRef}
        type="text"
        name="_gotcha"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
    </div>
  );
}

type ReplyAreaProps = {
  field: Field;
  disabled: boolean;
  pending: boolean;
  onSubmit: (value: unknown) => void;
};

function ReplyArea({ field, disabled, pending, onSubmit }: ReplyAreaProps) {
  switch (field.type) {
    case "long_text":
      return (
        <LongTextReply field={field} disabled={disabled} onSubmit={onSubmit} />
      );
    case "single_choice":
      return (
        <SingleChoiceReply
          field={field}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoiceReply
          field={field}
          disabled={disabled}
          pending={pending}
          onSubmit={onSubmit}
        />
      );
    case "rating":
      return (
        <RatingReply field={field} disabled={disabled} onSubmit={onSubmit} />
      );
    case "date":
      return (
        <TextReply
          field={field}
          inputType="date"
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "email":
      return (
        <TextReply
          field={field}
          inputType="email"
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "number":
      return (
        <TextReply
          field={field}
          inputType="number"
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    default:
      return (
        <TextReply
          field={field}
          inputType="text"
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
  }
}

function SendButton({
  disabled,
  pending,
  label = "Send",
}: {
  disabled: boolean;
  pending?: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8854A] text-[#0a0a0a] transition-all hover:bg-[#E8854A]/90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowUp className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

const TEXT_INPUT_CLASS =
  "min-w-0 flex-1 rounded-full border border-white/[0.08] bg-[#141414] px-4 py-2.5 text-[15px] text-[#F2F2F2] outline-none transition-colors placeholder:text-[#6B6B6B] focus:border-[#E8854A]/50 disabled:opacity-50";

function TextReply({
  field,
  inputType,
  disabled,
  onSubmit,
}: {
  field: Field;
  inputType: string;
  disabled: boolean;
  onSubmit: (value: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = field.config.maxLength as number | undefined;
  const min = field.config.min as number | undefined;
  const max = field.config.max as number | undefined;

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor={field.id} className="sr-only">
        {field.label}
      </label>
      <input
        id={field.id}
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || "Type your answer…"}
        maxLength={maxLength}
        min={min}
        max={max}
        disabled={disabled}
        autoComplete="off"
        autoFocus
        aria-required={field.required}
        className={cn(
          TEXT_INPUT_CLASS,
          "[color-scheme:dark]",
        )}
      />
      <SendButton disabled={disabled} />
    </form>
  );
}

function LongTextReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (value: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const placeholder = (field.config.placeholder as string | undefined) ?? "";
  const maxLength = field.config.maxLength as number | undefined;

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label htmlFor={field.id} className="sr-only">
        {field.label}
      </label>
      <textarea
        id={field.id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(value);
          }
        }}
        placeholder={placeholder || "Type your answer…"}
        maxLength={maxLength}
        rows={1}
        disabled={disabled}
        autoFocus
        aria-required={field.required}
        className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#141414] px-4 py-2.5 text-[15px] leading-relaxed text-[#F2F2F2] outline-none transition-colors field-sizing-content placeholder:text-[#6B6B6B] focus:border-[#E8854A]/50 disabled:opacity-50"
      />
      <SendButton disabled={disabled} />
    </form>
  );
}

function SingleChoiceReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (value: unknown) => void;
}) {
  const options = optionsOf(field);
  return (
    <div
      role="group"
      aria-label={field.label}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={disabled}
          aria-label={opt.label}
          onClick={() => onSubmit(opt.id)}
          className="rounded-full border border-[#E8854A]/40 bg-[#E8854A]/[0.06] px-4 py-2 text-sm text-[#F2F2F2] transition-all hover:border-[#E8854A] hover:bg-[#E8854A]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultipleChoiceReply({
  field,
  disabled,
  pending,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  pending: boolean;
  onSubmit: (value: unknown) => void;
}) {
  const options = optionsOf(field);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(selected);
      }}
    >
      <div role="group" aria-label={field.label} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              aria-label={opt.label}
              onClick={() => toggle(opt.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40",
                on
                  ? "border-[#E8854A] bg-[#E8854A] text-[#0a0a0a]"
                  : "border-[#E8854A]/40 bg-[#E8854A]/[0.06] text-[#F2F2F2] hover:border-[#E8854A] hover:bg-[#E8854A]/15",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <SendButton disabled={disabled} pending={pending} />
      </div>
    </form>
  );
}

function RatingReply({
  field,
  disabled,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  onSubmit: (value: unknown) => void;
}) {
  const scale = (field.config.scale as number) ?? 5;
  const style = (field.config.style as "star" | "number") ?? "star";
  const [hover, setHover] = useState(0);

  return (
    <div
      role="group"
      aria-label={`Rating out of ${scale}`}
      className="flex flex-wrap gap-2"
    >
      {Array.from({ length: scale }, (_, i) => i + 1).map((n) => {
        const active = n <= hover;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${n} out of ${scale}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onSubmit(n)}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-[#E8854A] bg-[#E8854A]/15 text-[#E8854A]"
                : "border-white/[0.08] bg-[#141414] text-[#6B6B6B] hover:border-[#E8854A]/50",
            )}
          >
            {style === "star" ? (
              <Star
                className={cn("size-5", active && "fill-[#E8854A]")}
                aria-hidden="true"
              />
            ) : (
              <span className="text-sm font-medium">{n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

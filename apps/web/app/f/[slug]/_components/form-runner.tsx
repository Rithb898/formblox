"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Check, Loader2, Star, Sparkles } from "lucide-react";
import { buildResponseSchema, zodForField, type FieldType } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Field = {
  id: string;
  order: number;
  type: string;
  label: string;
  required: boolean;
  config: Record<string, unknown>;
};

type AiFollowup = {
  fieldId: string;
  fieldLabel: string;
  userAnswer: string;
  aiQuestion: string;
  streaming: boolean;
};

type DebriefState =
  | { tag: "idle" }
  | { tag: "active"; index: number }
  | { tag: "saving" }
  | { tag: "done" };

type Props = {
  slug: string;
  title: string;
  description: string | null;
  fields: Field[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRIENDLY_ERRORS: Record<string, string> = {
  rate_limited: "Too many submissions. Please wait a moment and try again.",
  not_accepting_responses: "This form is no longer accepting responses.",
  not_published: "This form is no longer accepting responses.",
};

const TYPING_MS = 600;

type ChoiceOption = { id: string; label: string };
function optionsOf(f: Field): ChoiceOption[] {
  return (f.config.options as ChoiceOption[] | undefined) ?? [];
}

function formatAnswer(field: Field, value: unknown): string {
  if (field.type === "single_choice")
    return optionsOf(field).find((o) => o.id === value)?.label ?? "";
  if (field.type === "multiple_choice") {
    const ids = (value as string[] | undefined) ?? [];
    return ids.map((id) => optionsOf(field).find((o) => o.id === id)?.label ?? id).join(", ");
  }
  if (field.type === "rating") {
    const n = Number(value) || 0;
    return (field.config.style as string) === "number" ? `${n}` : "★".repeat(n);
  }
  return value == null ? "" : String(value);
}

function isFollowupEligible(f: Field): boolean {
  return (
    (f.type === "short_text" || f.type === "long_text") && f.config.aiFollowupEnabled !== false
  );
}

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-[#E8854A] text-[13px] font-semibold text-[#0a0a0a]">
      {initial}
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full border border-white/[0.08] bg-[#1E1E1E]">
      <Sparkles className="size-3.5 text-[#9B9B9B]" />
    </div>
  );
}

function TypingDots({ color = "#6B6B6B" }: { color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="size-1.5 rounded-full animate-typing-bounce"
          style={{ background: color, animationDelay: `${d}ms` }}
        />
      ))}
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
    <div className={cn("flex items-end gap-2.5 animate-bubble-in-left", faded && "opacity-60")}>
      <Avatar initial={initial} />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        {field.label}
        {field.required && <span className="ml-1 text-[#E8854A]">*</span>}
      </div>
    </div>
  );
}

function AnswerBubble({ text, faded }: { text: string; faded: boolean }) {
  return (
    <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-[#E8854A] px-4 py-3 text-[15px] leading-relaxed text-[#0a0a0a]">
        {text || "—"}
      </div>
    </div>
  );
}

function AiFollowUpBubble({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3">
        <span className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-3 text-[#6B6B6B]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">AI</span>
        </span>
        <p className="text-[15px] leading-relaxed text-[#F2F2F2]">
          {text}
          {streaming && (
            <span className="ml-0.5 inline-block size-[3px] animate-pulse rounded-full bg-[#9B9B9B] align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}

function AiFollowUpAnswer({
  text,
  skipped,
  faded,
}: {
  text: string | null;
  skipped?: boolean;
  faded?: boolean;
}) {
  if (skipped) {
    return (
      <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
        <span className="rounded-full border border-white/[0.07] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#3A3A3A]">
          Skipped
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm border border-white/[0.07] bg-[#1A1A1A] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        {text}
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8854A]">
        <Check className="size-4 text-[#0a0a0a]" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        Thanks — we got it.
      </div>
    </div>
  );
}

function AllDoneState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3 text-[15px] leading-relaxed text-[#F2F2F2]">
        That's all — thank you for sharing!
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FormRunner({ slug, title, description, fields }: Props) {
  const ordered = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);
  const initial = (title.trim()[0] ?? "F").toUpperCase();

  // Form state
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Background-prefetched AI follow-ups (keyed by fieldId)
  const [aiFollowups, setAiFollowups] = useState<Map<string, AiFollowup>>(new Map());
  const aiFollowupsRef = useRef<Map<string, AiFollowup>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Debrief state (shown after form submit)
  const [debrief, setDebrief] = useState<DebriefState>({ tag: "idle" });
  // Answers collected during debrief: fieldId → answer | null
  const [debriefAnswers, setDebriefAnswers] = useState<Map<string, string | null>>(new Map());

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
    () => Object.fromEntries(ordered.map((f) => [f.id, f.type === "multiple_choice" ? [] : ""])),
    [ordered],
  );
  const form = useForm<Record<string, unknown>>({ resolver: zodResolver(schema), defaultValues });

  const submitMutation = trpc.forms.public.submit.useMutation();
  const saveFollowupsMutation = trpc.forms.public.saveFollowups.useMutation();

  const total = ordered.length;
  const current = ordered[step];

  // Typing indicator on each new question
  useEffect(() => {
    if (step >= total) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), TYPING_MS);
    return () => clearTimeout(t);
  }, [step, total]);

  // Confetti from both bottom corners when done
  useEffect(() => {
    if (debrief.tag !== "done") return;
    const shared = {
      particleCount: 80,
      spread: 70,
      startVelocity: 55,
      ticks: 200,
      colors: ["#E8854A", "#F2F2F2", "#FFD580", "#FF9F6B", "#FFFFFF"],
    };
    confetti({ ...shared, origin: { x: 0, y: 1 }, angle: 60 });
    confetti({ ...shared, origin: { x: 1, y: 1 }, angle: 120 });
  }, [debrief.tag]);

  // Keep ref in sync so finalize() reads fresh aiFollowups without stale closure
  useEffect(() => {
    aiFollowupsRef.current = aiFollowups;
  }, [aiFollowups]);

  // Auto-scroll on discrete state transitions
  useEffect(() => {
    const t = setTimeout(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
    return () => clearTimeout(t);
  }, [step, typing, submitted, debrief, debriefAnswers]);

  // Auto-scroll during AI streaming — no cleanup so rapid chunk updates don't cancel each other
  useEffect(() => {
    requestAnimationFrame(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [aiFollowups]);

  // ---------------------------------------------------------------------------
  // Background AI prefetch — fires as soon as user answers a text field
  // ---------------------------------------------------------------------------
  const prefetchFollowup = useCallback((field: Field, answer: string) => {
    if (!isFollowupEligible(field)) return;

    // Cancel any previous fetch for this field
    abortControllers.current.get(field.id)?.abort();
    const ctrl = new AbortController();
    abortControllers.current.set(field.id, ctrl);

    // Optimistically mark as streaming
    setAiFollowups((prev) =>
      new Map(prev).set(field.id, {
        fieldId: field.id,
        fieldLabel: field.label,
        userAnswer: answer,
        aiQuestion: "",
        streaming: true,
      }),
    );

    void (async () => {
      try {
        const res = await fetch("/api/ai/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: field.label, answer }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
          return;
        }

        let fullText = "";
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          if (ctrl.signal.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          const trimmed = fullText.trim();
          setAiFollowups((prev) =>
            new Map(prev).set(field.id, {
              fieldId: field.id,
              fieldLabel: field.label,
              userAnswer: answer,
              aiQuestion: trimmed,
              streaming: true,
            }),
          );
        }

        const finalText = fullText.trim();
        if (finalText) {
          setAiFollowups((prev) =>
            new Map(prev).set(field.id, {
              fieldId: field.id,
              fieldLabel: field.label,
              userAnswer: answer,
              aiQuestion: finalText,
              streaming: false,
            }),
          );
        } else {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
        }
      } catch {
        if (!ctrl.signal.aborted) {
          setAiFollowups((prev) => {
            const m = new Map(prev);
            m.delete(field.id);
            return m;
          });
        }
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Form answer validation + advance
  // ---------------------------------------------------------------------------
  function validateAndAdvance(rawValue: unknown) {
    if (typing || !current) return;
    setFieldError(null);

    const validator = zodForField({
      id: current.id,
      type: current.type as FieldType,
      required: current.required,
      config: current.config,
    });

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

    // Kick off background AI fetch immediately (non-blocking)
    if (typeof rawValue === "string" && rawValue.trim()) {
      prefetchFollowup(current, rawValue.trim());
    }

    if (step + 1 >= total) {
      void finalize();
    } else {
      setStep((s) => s + 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Submit form
  // ---------------------------------------------------------------------------
  async function finalize() {
    setBannerError(null);
    const values = form.getValues();
    try {
      const { id } = await submitMutation.mutateAsync({
        slug,
        answers: values,
        _gotcha: honeypotRef.current?.value ?? "",
      });
      setResponseId(id);
      setSubmitted(true);

      // Determine if there are eligible follow-ups to show (use ref to avoid stale closure)
      const eligible = ordered.filter((f) => isFollowupEligible(f) && aiFollowupsRef.current.has(f.id));
      if (eligible.length > 0) {
        setDebrief({ tag: "active", index: 0 });
      } else {
        // No AI follow-ups — go straight to done so SuccessState renders
        setDebrief({ tag: "done" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setBannerError(FRIENDLY_ERRORS[msg] ?? "Something went wrong. Please try again.");
    }
  }

  // ---------------------------------------------------------------------------
  // Debrief: user answers (or skips) each AI follow-up
  // ---------------------------------------------------------------------------
  const eligibleFollowupFields = useMemo(
    () => ordered.filter((f) => isFollowupEligible(f) && aiFollowups.has(f.id)),
    [ordered, aiFollowups],
  );

  async function handleDebriefAnswer(fieldId: string, answer: string | null) {
    const newAnswers = new Map(debriefAnswers).set(fieldId, answer);
    setDebriefAnswers(newAnswers);

    const currentIdx = debrief.tag === "active" ? debrief.index : 0;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= eligibleFollowupFields.length) {
      // All done — persist to DB
      setDebrief({ tag: "saving" });
      const followupsToSave = eligibleFollowupFields
        .map((f) => {
          const fu = aiFollowups.get(f.id);
          if (!fu || !fu.aiQuestion) return null;
          const ua = newAnswers.get(f.id) ?? null;
          return { fieldId: f.id, aiQuestion: fu.aiQuestion, userAnswer: ua };
        })
        .filter(Boolean) as { fieldId: string; aiQuestion: string; userAnswer: string | null }[];

      if (responseId && followupsToSave.length > 0) {
        try {
          await saveFollowupsMutation.mutateAsync({ responseId, followups: followupsToSave });
        } catch {
          // Non-fatal — data is collected, persist failure shouldn't block UX
        }
      }
      setDebrief({ tag: "done" });
    } else {
      setDebrief({ tag: "active", index: nextIdx });
    }
  }

  // ---------------------------------------------------------------------------
  // Computed UI flags
  // ---------------------------------------------------------------------------
  const progressPct = submitted ? 100 : total === 0 ? 100 : (step / total) * 100;
  const counter = `${String(submitted ? total : step + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const currentDebriefField =
    debrief.tag === "active" ? (eligibleFollowupFields[debrief.index] ?? null) : null;
  const currentDebriefFollowup = currentDebriefField
    ? aiFollowups.get(currentDebriefField.id)
    : null;
  const waitingOnAi = currentDebriefFollowup?.streaming ?? false;

  const showFormFooter = !submitted && !!current;
  const showDebriefFooter = debrief.tag === "active" && !!currentDebriefField && !waitingOnAi;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#080808] text-[#F2F2F2]">
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh]"
        style={{
          background: "radial-gradient(60% 60% at 50% 0%, rgba(232,133,74,0.10), transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#080808]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
          <h1 className="truncate text-sm font-semibold tracking-tight text-[#F2F2F2]">{title}</h1>
          <span className="shrink-0 font-mono text-xs text-[#6B6B6B]">{counter}</span>
        </div>
        <div className="h-[2px] w-full bg-white/[0.04]">
          <div
            className="h-full bg-[#E8854A] transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Thread */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
          {description && <p className="text-sm leading-relaxed text-[#6B6B6B]">{description}</p>}

          {bannerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-xl border border-[#E8854A]/40 bg-[#E8854A]/10 px-4 py-3 text-sm text-[#E8854A]"
            >
              {bannerError}
            </div>
          )}

          {/* Form Q&A bubbles */}
          {ordered.map((field, i) => {
            if (i > step) return null;
            const answered = i < step || submitted;
            return (
              <div key={field.id} className="flex flex-col gap-5">
                <QuestionBubble field={field} initial={initial} faded={answered} />
                {answered && (
                  <AnswerBubble
                    text={formatAnswer(field, form.getValues(field.id))}
                    faded={answered}
                  />
                )}
              </div>
            );
          })}

          {/* Typing indicator for next form question */}
          {!submitted && typing && step < total && (
            <div className="flex items-end gap-2.5">
              <Avatar initial={initial} />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3.5">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Debrief: past follow-up Q&As */}
          {submitted &&
            eligibleFollowupFields.map((field, i) => {
              const fu = aiFollowups.get(field.id);
              if (!fu) return null;

              const isCurrentDebrief = debrief.tag === "active" && debrief.index === i;
              const isPastDebrief = debriefAnswers.has(field.id);
              if (!isCurrentDebrief && !isPastDebrief) return null;

              const userAnswer = debriefAnswers.get(field.id);
              const faded = isPastDebrief && !isCurrentDebrief;

              return (
                <div key={`fu-${field.id}`} className="flex flex-col gap-5">
                  {/* AI question bubble */}
                  {fu.aiQuestion ? (
                    <AiFollowUpBubble
                      text={fu.aiQuestion}
                      streaming={isCurrentDebrief && fu.streaming}
                    />
                  ) : (
                    // Still streaming when this debrief item is first shown
                    <div className="flex items-end gap-2.5 animate-bubble-in-left">
                      <AiAvatar />
                      <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3.5">
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  {/* User's answer (only if already answered) */}
                  {isPastDebrief && (
                    <AiFollowUpAnswer
                      text={userAnswer ?? null}
                      skipped={userAnswer === null}
                      faded={faded}
                    />
                  )}
                </div>
              );
            })}

          {/* Saving indicator */}
          {debrief.tag === "saving" && (
            <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </div>
          )}

          {debrief.tag === "done" && (eligibleFollowupFields.length > 0 ? <AllDoneState /> : <SuccessState />)}

          <div ref={threadEndRef} className={debrief.tag === "done" ? "pb-16" : ""} />
        </div>
      </main>

      {/* Form reply footer */}
      {showFormFooter && (
        <footer className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-4">
            {fieldError && (
              <p role="alert" className="mb-2 text-xs font-medium text-[#E8854A]">
                {fieldError}
              </p>
            )}
            <ReplyArea
              key={current.id}
              field={current}
              disabled={typing || submitMutation.isPending}
              pending={submitMutation.isPending}
              onSubmit={validateAndAdvance}
            />
          </div>
        </footer>
      )}

      {/* Debrief reply footer */}
      {showDebriefFooter && currentDebriefField && (
        <footer className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-4">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6B6B6B]">
              <Sparkles className="size-3" />
              AI follow-up · {String(debrief.tag === "active" ? debrief.index + 1 : 1).padStart(2, "0")} / {String(eligibleFollowupFields.length).padStart(2, "0")}
            </p>
            <FollowupReplyArea
              key={currentDebriefField.id}
              onSubmit={(a) => void handleDebriefAnswer(currentDebriefField.id, a)}
              onSkip={() => void handleDebriefAnswer(currentDebriefField.id, null)}
              pending={saveFollowupsMutation.isPending}
            />
          </div>
        </footer>
      )}

      {/* Waiting on AI to finish streaming before showing debrief input */}
      {debrief.tag === "active" && waitingOnAi && (
        <footer className="sticky bottom-0 z-20 border-t border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <Loader2 className="size-3.5 animate-spin" />
              AI is thinking…
            </div>
            {currentDebriefField && (
              <Button
                type="button"
                onClick={() => void handleDebriefAnswer(currentDebriefField.id, null)}
                className="cursor-pointer rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-[#6B6B6B] transition-colors hover:border-white/20 hover:text-[#F2F2F2]"
              >
                Skip
              </Button>
            )}
          </div>
        </footer>
      )}

      <Input
        unstyled
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

// ---------------------------------------------------------------------------
// Reply areas (form fields)
// ---------------------------------------------------------------------------

type ReplyAreaProps = {
  field: Field;
  disabled: boolean;
  pending: boolean;
  onSubmit: (value: unknown) => void;
};

function ReplyArea({ field, disabled, pending, onSubmit }: ReplyAreaProps) {
  switch (field.type) {
    case "long_text":
      return <LongTextReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "single_choice":
      return <SingleChoiceReply field={field} disabled={disabled} onSubmit={onSubmit} />;
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
      return <RatingReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "date":
      return <TextReply field={field} inputType="date" disabled={disabled} onSubmit={onSubmit} />;
    case "email":
      return <TextReply field={field} inputType="email" disabled={disabled} onSubmit={onSubmit} />;
    case "number":
      return <TextReply field={field} inputType="number" disabled={disabled} onSubmit={onSubmit} />;
    default:
      return <TextReply field={field} inputType="text" disabled={disabled} onSubmit={onSubmit} />;
  }
}

function FollowupReplyArea({
  onSubmit,
  onSkip,
  pending,
}: {
  onSubmit: (a: string) => void;
  onSkip: () => void;
  pending: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <Textarea
        unstyled
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSubmit(value.trim());
          }
        }}
        placeholder="Share more…"
        rows={1}
        autoFocus
        disabled={pending}
        className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#141414] px-4 py-2.5 text-[15px] leading-relaxed text-[#F2F2F2] outline-none transition-colors field-sizing-content placeholder:text-[#6B6B6B] focus:border-[#E8854A]/50 disabled:opacity-50"
      />
      <Button
        type="button"
        onClick={onSkip}
        disabled={pending}
        className="cursor-pointer shrink-0 rounded-full border border-white/[0.08] px-3 py-2 text-xs text-[#6B6B6B] transition-all hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-40"
      >
        Skip
      </Button>
      <Button
        type="submit"
        disabled={pending || !value.trim()}
        aria-label="Send reply"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8854A] text-[#0a0a0a] transition-all hover:bg-[#E8854A]/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
      </Button>
    </form>
  );
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
    <Button
      type="submit"
      disabled={disabled}
      aria-label={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8854A] text-[#0a0a0a] transition-all hover:bg-[#E8854A]/90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
    </Button>
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
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ph = (field.config.placeholder as string | undefined) ?? "";

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

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
      <Input
        unstyled
        ref={inputRef}
        id={field.id}
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={ph || "Type your answer…"}
        maxLength={field.config.maxLength as number | undefined}
        min={field.config.min as number | undefined}
        max={field.config.max as number | undefined}
        disabled={disabled}
        autoComplete="off"
        aria-required={field.required}
        className={cn(TEXT_INPUT_CLASS, "[color-scheme:dark]")}
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
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ph = (field.config.placeholder as string | undefined) ?? "";

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

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
      <Textarea
        unstyled
        ref={textareaRef}
        id={field.id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(value);
          }
        }}
        placeholder={ph || "Type your answer…"}
        maxLength={field.config.maxLength as number | undefined}
        rows={1}
        disabled={disabled}
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
  onSubmit: (v: unknown) => void;
}) {
  return (
    <div role="group" aria-label={field.label} className="flex flex-wrap gap-2">
      {optionsOf(field).map((opt) => (
        <Button
          type="button"
          key={opt.id}
          disabled={disabled}
          onClick={() => onSubmit(opt.id)}
          className="cursor-pointer rounded-full border border-[#E8854A]/40 bg-[#E8854A]/[0.06] px-4 py-2 text-sm text-[#F2F2F2] transition-all hover:border-[#E8854A] hover:bg-[#E8854A]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {opt.label}
        </Button>
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
  onSubmit: (v: unknown) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
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
        {optionsOf(field).map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <Button
              type="button"
              key={opt.id}
              disabled={disabled}
              aria-pressed={on}
              onClick={() => toggle(opt.id)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40",
                on
                  ? "border-[#E8854A] bg-[#E8854A] text-[#0a0a0a]"
                  : "border-[#E8854A]/40 bg-[#E8854A]/[0.06] text-[#F2F2F2] hover:border-[#E8854A] hover:bg-[#E8854A]/15",
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <SendButton disabled={disabled || (field.required && selected.length === 0)} pending={pending} />
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
  onSubmit: (v: unknown) => void;
}) {
  const scale = (field.config.scale as number) ?? 5;
  const style = (field.config.style as "star" | "number") ?? "star";
  const [hover, setHover] = useState(0);
  return (
    <div role="group" aria-label={`Rating out of ${scale}`} className="flex flex-wrap gap-2">
      {Array.from({ length: scale }, (_, i) => i + 1).map((n) => {
        const active = n <= hover;
        return (
          <Button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${n} out of ${scale}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onSubmit(n)}
            className={cn(
              "flex size-11 cursor-pointer items-center justify-center rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-[#E8854A] bg-[#E8854A]/15 text-[#E8854A]"
                : "border-white/[0.08] bg-[#141414] text-[#6B6B6B] hover:border-[#E8854A]/50",
            )}
          >
            {style === "star" ? (
              <Star className={cn("size-5", active && "fill-[#E8854A]")} />
            ) : (
              <span className="text-sm font-medium">{n}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Re-export for page-level use if needed
export { AiFollowUpBubble };

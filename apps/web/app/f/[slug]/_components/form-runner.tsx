"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Check, Loader2, Pencil, Star, Sparkles } from "lucide-react";
import { buildResponseSchema, zodForField, type FieldType, type FormTheme } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { themeToCSSVars, hexToRgba } from "~/lib/theme";
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
  theme: FormTheme | null | undefined;
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

function coerceAndValidate(
  field: Field,
  rawValue: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  const validator = zodForField({
    id: field.id,
    type: field.type as FieldType,
    required: field.required,
    config: field.config,
  });

  let value = rawValue;
  if (typeof value === "string" && value.trim() === "") value = undefined;
  if (field.type === "number" && typeof value === "string") {
    value = value === "" ? undefined : Number(value);
  }

  const result = validator.safeParse(value);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid answer" };
  }
  return { ok: true, value };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type SavedProgress = { step: number; values: Record<string, unknown>; fieldIds: string[] };

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-(--form-accent) text-[13px] font-semibold text-(--form-text-on-accent)">
      {initial}
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="mt-0.5 flex size-7 shrink-0 select-none items-center justify-center rounded-full border border-white/8 bg-[color-mix(in_srgb,var(--form-ai-accent)_18%,var(--form-avatar-bg))]">
      <Sparkles className="size-3.5 text-(--form-ai-accent)" />
    </div>
  );
}

function TypingDots({ color = "var(--form-text-muted)" }: { color?: string }) {
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
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        {field.label}
        {field.required && <span className="ml-1 text-(--form-accent)">*</span>}
      </div>
    </div>
  );
}

function AnswerBubble({
  text,
  faded,
  onEdit,
}: {
  text: string;
  faded: boolean;
  onEdit?: () => void;
}) {
  if (!onEdit) {
    return (
      <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
        <div className="max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-on-accent)">
          {text || "—"}
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "group flex items-center justify-end gap-2 animate-bubble-in-right",
        faded && "opacity-60",
      )}
    >
      <Pencil className="size-3 shrink-0 text-(--form-text-muted) opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
      <button
        type="button"
        onClick={onEdit}
        title="Edit answer"
        aria-label="Edit this answer"
        className="max-w-[80%] cursor-pointer whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-left text-[15px] leading-relaxed text-(--form-text-on-accent) transition-opacity hover:opacity-85"
      >
        {text || "—"}
      </button>
    </div>
  );
}

function AiFollowUpBubble({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-[color-mix(in_srgb,var(--form-ai-accent)_25%,transparent)] bg-(--form-surface) px-4 py-3">
        <span className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-3 text-(--form-ai-accent)" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--form-ai-accent)">AI</span>
        </span>
        <p aria-live="polite" className="text-[15px] leading-relaxed text-(--form-text-primary)">
          {text}
          {streaming && (
            <span className="ml-0.5 inline-block size-0.75 animate-pulse rounded-full bg-(--form-ai-accent) align-middle" />
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
        <span className="rounded-full border border-white/7 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#3A3A3A]">
          Skipped
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex justify-end animate-bubble-in-right", faded && "opacity-60")}>
      <div className="max-w-[80%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-sm bg-(--form-accent) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-on-accent)">
        {text}
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--form-accent)">
        <Check className="size-4 text-(--form-text-on-accent)" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        Thanks — we got it.
      </div>
    </div>
  );
}

function AllDoneState() {
  return (
    <div className="flex animate-bubble-in-left items-end gap-2.5">
      <AiAvatar />
      <div className="rounded-2xl rounded-bl-sm border border-white/7 bg-(--form-surface) px-4 py-3 text-[15px] leading-relaxed text-(--form-text-primary)">
        That&apos;s all — thank you for sharing!
      </div>
    </div>
  );
}

function DoneActions({ slug, onReset }: { slug: string; onReset: () => void }) {
  return (
    <div className="mt-2 flex animate-fade-up flex-col items-center gap-5 rounded-2xl border border-white/7 bg-(--form-surface) px-6 py-8 text-center">
      <p className="text-sm leading-relaxed text-(--form-text-muted)">
        Your response has been recorded.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          onClick={onReset}
          className="cursor-pointer rounded-full border border-white/8 px-4 py-2 text-sm text-(--form-text-primary) transition-colors hover:border-white/20 hover:bg-white/4"
        >
          Submit another response
        </Button>
        <Link
          href={`/signup?utm_source=public_form&utm_medium=referral&utm_content=${encodeURIComponent(slug)}`}
          className="rounded-full bg-(--form-accent) px-4 py-2 text-sm font-medium text-(--form-text-on-accent) transition-opacity hover:opacity-90"
        >
          Create your own form
        </Link>
      </div>
      <Link
        href="/"
        className="font-mono text-[10px] uppercase tracking-widest text-(--form-text-muted) transition-colors hover:text-(--form-text-primary)"
      >
        Powered by Formblox
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FormRunner({ slug, title, description, theme, fields }: Props) {
  const cssVars = useMemo(() => themeToCSSVars(theme), [theme]);
  const accent = cssVars["--form-accent"] ?? "#E8854A";
  const ordered = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);
  const initial = (title.trim()[0] ?? "F").toUpperCase();

  // Form state
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  // Bumped on "Submit another response" so the typing-indicator effect refires even at step 0
  const [runKey, setRunKey] = useState(0);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const storageKey = `formblox:f:${slug}`;

  // Background-prefetched AI follow-ups (keyed by fieldId)
  const [aiFollowups, setAiFollowups] = useState<Map<string, AiFollowup>>(new Map());
  const aiFollowupsRef = useRef<Map<string, AiFollowup>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Debrief state (shown after form submit)
  const [debrief, setDebrief] = useState<DebriefState>({ tag: "idle" });
  // Answers collected during debrief: fieldId → answer | null
  const [debriefAnswers, setDebriefAnswers] = useState<Map<string, string | null>>(new Map());

  const threadEndRef = useRef<HTMLDivElement>(null);
  // True while the user is at (or near) the bottom of the thread — auto-scroll only then,
  // so someone scrolling back up to reread isn't yanked down.
  const stickToBottomRef = useRef(true);

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
  }, [step, total, runKey]);

  // Confetti from both bottom corners when done
  useEffect(() => {
    if (debrief.tag !== "done" || prefersReducedMotion()) return;
    const shared = {
      particleCount: 80,
      spread: 70,
      startVelocity: 55,
      ticks: 200,
      colors: [accent, cssVars["--form-text-primary"]!, "#FFD580", "#FF9F6B", "#FFFFFF"],
    };
    confetti({ ...shared, origin: { x: 0, y: 1 }, angle: 60 });
    confetti({ ...shared, origin: { x: 1, y: 1 }, angle: 120 });
  }, [debrief.tag, accent, cssVars]);

  // Keep ref in sync so finalize() reads fresh aiFollowups without stale closure
  useEffect(() => {
    aiFollowupsRef.current = aiFollowups;
  }, [aiFollowups]);

  // Track whether the user is near the bottom of the page
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      stickToBottomRef.current = window.innerHeight + window.scrollY >= doc.scrollHeight - 120;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll on discrete state transitions
  useEffect(() => {
    const t = setTimeout(() => {
      if (stickToBottomRef.current) {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [step, typing, submitted, debrief, debriefAnswers]);

  // Auto-scroll during AI streaming. Instant, not smooth: each smooth scroll cancels the
  // previous one, so with rapid chunks the animation restarts forever and never reaches bottom.
  useEffect(() => {
    requestAnimationFrame(() => {
      if (stickToBottomRef.current) {
        threadEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
      }
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
  // Progress persistence — survive accidental refresh / tab close mid-form
  // ---------------------------------------------------------------------------
  const persistProgress = useCallback(
    (nextStep: number) => {
      try {
        const snapshot: SavedProgress = {
          step: nextStep,
          values: form.getValues(),
          fieldIds: ordered.map((f) => f.id),
        };
        sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
      } catch {
        // Storage unavailable (private mode, quota) — non-fatal
      }
    },
    [storageKey, form, ordered],
  );

  // Restore saved progress on mount; refire AI prefetch for restored text answers
  // since in-memory follow-ups were lost on reload.
  useEffect(() => {
    let saved: SavedProgress;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      saved = JSON.parse(raw) as SavedProgress;
    } catch {
      return;
    }

    const ids = ordered.map((f) => f.id);
    const valid =
      Array.isArray(saved.fieldIds) &&
      saved.fieldIds.length === ids.length &&
      saved.fieldIds.every((id, i) => id === ids[i]) &&
      typeof saved.step === "number" &&
      saved.step > 0 &&
      saved.values !== null &&
      typeof saved.values === "object";
    if (!valid) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      return;
    }

    // step === total means a submit was in flight when the page closed — re-ask the last question
    const restoredStep = Math.min(saved.step, ids.length - 1);
    form.reset({ ...defaultValues, ...saved.values });
    setStep(restoredStep);
    for (const f of ordered.slice(0, restoredStep)) {
      const v = saved.values[f.id];
      if (typeof v === "string" && v.trim()) prefetchFollowup(f, v.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Form answer validation + advance
  // ---------------------------------------------------------------------------
  function validateAndAdvance(rawValue: unknown) {
    if (typing || !current) return;
    setFieldError(null);

    const checked = coerceAndValidate(current, rawValue);
    if (!checked.ok) {
      setFieldError(checked.error);
      return;
    }

    form.setValue(current.id, checked.value === undefined ? "" : checked.value);
    persistProgress(step + 1);

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

  // Edit a previously answered question (pre-submit only)
  const editingField = editingFieldId
    ? (ordered.find((f) => f.id === editingFieldId) ?? null)
    : null;

  function handleEditSubmit(rawValue: unknown) {
    if (!editingField) return;
    setFieldError(null);

    const checked = coerceAndValidate(editingField, rawValue);
    if (!checked.ok) {
      setFieldError(checked.error);
      return;
    }

    form.setValue(editingField.id, checked.value === undefined ? "" : checked.value);
    persistProgress(step);

    if (typeof rawValue === "string" && rawValue.trim()) {
      // Re-run the follow-up against the new answer
      prefetchFollowup(editingField, rawValue.trim());
    } else if (isFollowupEligible(editingField)) {
      // Answer cleared — drop any stale follow-up for it
      abortControllers.current.get(editingField.id)?.abort();
      setAiFollowups((prev) => {
        const m = new Map(prev);
        m.delete(editingField.id);
        return m;
      });
    }

    setEditingFieldId(null);
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
      setEditingFieldId(null);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }

      // Determine if there are eligible follow-ups to show (use ref to avoid stale closure)
      const eligible = ordered.filter(
        (f) => isFollowupEligible(f) && aiFollowupsRef.current.has(f.id),
      );
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

  // Persist follow-ups with one retry; non-fatal on failure (shouldn't block UX)
  async function saveFollowupBatch(
    followups: { fieldId: string; aiQuestion: string; userAnswer: string | null }[],
  ) {
    if (!responseId || followups.length === 0) return;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await saveFollowupsMutation.mutateAsync({ responseId, followups });
        return;
      } catch {
        // retry once, then give up silently
      }
    }
  }

  async function handleDebriefAnswer(fieldId: string, answer: string | null) {
    setDebriefAnswers((prev) => new Map(prev).set(fieldId, answer));

    const fu = aiFollowups.get(fieldId);
    const toSave = fu?.aiQuestion
      ? [{ fieldId, aiQuestion: fu.aiQuestion, userAnswer: answer }]
      : [];

    const currentIdx = debrief.tag === "active" ? debrief.index : 0;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= eligibleFollowupFields.length) {
      setDebrief({ tag: "saving" });
      await saveFollowupBatch(toSave);
      setDebrief({ tag: "done" });
    } else {
      setDebrief({ tag: "active", index: nextIdx });
      // Save each answer as it lands so closing the tab mid-debrief loses nothing
      void saveFollowupBatch(toSave);
    }
  }

  async function handleSkipAll() {
    const currentIdx = debrief.tag === "active" ? debrief.index : 0;
    const remaining = eligibleFollowupFields.slice(currentIdx);

    // Stop any in-flight streams for skipped questions
    for (const f of remaining) abortControllers.current.get(f.id)?.abort();

    setDebriefAnswers((prev) => {
      const m = new Map(prev);
      for (const f of remaining) m.set(f.id, null);
      return m;
    });

    setDebrief({ tag: "saving" });
    const toSave = remaining
      .map((f) => {
        const fu = aiFollowups.get(f.id);
        if (!fu?.aiQuestion) return null;
        return { fieldId: f.id, aiQuestion: fu.aiQuestion, userAnswer: null };
      })
      .filter(Boolean) as { fieldId: string; aiQuestion: string; userAnswer: string | null }[];
    await saveFollowupBatch(toSave);
    setDebrief({ tag: "done" });
  }

  // Full reset for "Submit another response"
  const resetAll = useCallback(() => {
    for (const c of abortControllers.current.values()) c.abort();
    abortControllers.current.clear();
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    form.reset(defaultValues);
    setStep(0);
    setRunKey((k) => k + 1);
    setFieldError(null);
    setBannerError(null);
    setSubmitted(false);
    setResponseId(null);
    setEditingFieldId(null);
    setAiFollowups(new Map());
    setDebrief({ tag: "idle" });
    setDebriefAnswers(new Map());
    window.scrollTo({ top: 0 });
  }, [form, defaultValues, storageKey]);

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

  const showFormFooter = !submitted && (!!current || !!editingField);
  const showDebriefFooter = debrief.tag === "active" && !!currentDebriefField && !waitingOnAi;
  const remainingFollowups =
    debrief.tag === "active" ? eligibleFollowupFields.length - debrief.index : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative flex min-h-dvh flex-col bg-(--form-bg) text-(--form-text-primary)" style={cssVars}>
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh]"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, ${hexToRgba(accent, 0.10)}, transparent 70%)`,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/6 bg-[color-mix(in_srgb,var(--form-bg)_70%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
          <h1 className="truncate text-sm font-semibold tracking-tight text-(--form-text-primary)">{title}</h1>
          <span className="shrink-0 font-mono text-xs text-(--form-text-muted)">{counter}</span>
        </div>
        <div className="h-0.5 w-full bg-white/4">
          <div
            className="h-full bg-(--form-accent) transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Thread */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8">
          {description && <p className="text-sm leading-relaxed text-(--form-text-muted)">{description}</p>}

          {bannerError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-xl border border-[color-mix(in_srgb,var(--form-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--form-accent)_10%,transparent)] px-4 py-3 text-sm text-(--form-accent)"
            >
              {bannerError}
            </div>
          )}

          {/* Form Q&A bubbles */}
          {ordered.map((field, i) => {
            if (i > step) return null;
            const answered = i < step || submitted;
            const isEditing = editingFieldId === field.id;
            return (
              <div key={field.id} className="flex flex-col gap-5">
                <QuestionBubble field={field} initial={initial} faded={answered && !isEditing} />
                {answered && (
                  <AnswerBubble
                    text={formatAnswer(field, form.getValues(field.id))}
                    faded={answered && !isEditing}
                    onEdit={
                      !submitted && !submitMutation.isPending
                        ? () => {
                            setFieldError(null);
                            setEditingFieldId(field.id);
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            );
          })}

          {/* Typing indicator for next form question */}
          {!submitted && typing && step < total && (
            <div className="flex items-end gap-2.5">
              <Avatar initial={initial} />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.07] bg-(--form-surface) px-4 py-3.5">
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
                      <div className="rounded-2xl rounded-bl-sm border border-white/[0.07] bg-(--form-surface) px-4 py-3.5">
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
            <div className="flex items-center gap-2 text-xs text-(--form-text-muted)">
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </div>
          )}

          {debrief.tag === "done" && (
            <>
              {eligibleFollowupFields.length > 0 ? <AllDoneState /> : <SuccessState />}
              <DoneActions slug={slug} onReset={resetAll} />
            </>
          )}

          <div ref={threadEndRef} className={debrief.tag === "done" ? "pb-16" : ""} />
        </div>
      </main>

      {/* Form reply footer */}
      {showFormFooter && (
        <footer className="sticky bottom-0 z-20 border-t border-white/6 bg-[color-mix(in_srgb,var(--form-bg)_80%,transparent)] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-4">
            {editingField && (
              <p className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-(--form-text-muted)">
                  <Pencil className="size-3 shrink-0" />
                  <span className="truncate">Editing: {editingField.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFieldId(null);
                    setFieldError(null);
                  }}
                  className="shrink-0 cursor-pointer text-(--form-text-muted) underline-offset-2 transition-colors hover:text-(--form-text-primary) hover:underline"
                >
                  Cancel
                </button>
              </p>
            )}
            {fieldError && (
              <p role="alert" className="mb-2 text-xs font-medium text-(--form-accent)">
                {fieldError}
              </p>
            )}
            {editingField ? (
              <ReplyArea
                key={`edit-${editingField.id}`}
                field={editingField}
                disabled={submitMutation.isPending}
                pending={submitMutation.isPending}
                initialValue={form.getValues(editingField.id)}
                onSubmit={handleEditSubmit}
              />
            ) : (
              current && (
                <ReplyArea
                  key={current.id}
                  field={current}
                  disabled={typing || submitMutation.isPending}
                  pending={submitMutation.isPending}
                  onSubmit={validateAndAdvance}
                />
              )
            )}
          </div>
        </footer>
      )}

      {/* Debrief reply footer */}
      {showDebriefFooter && currentDebriefField && (
        <footer className="sticky bottom-0 z-20 border-t border-white/6 bg-[color-mix(in_srgb,var(--form-bg)_80%,transparent)] backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-4">
            <p className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-(--form-ai-accent)">
                <Sparkles className="size-3" />
                AI follow-up ·{" "}
                {String(debrief.tag === "active" ? debrief.index + 1 : 1).padStart(2, "0")} /{" "}
                {String(eligibleFollowupFields.length).padStart(2, "0")}
              </span>
              {remainingFollowups > 1 && (
                <button
                  type="button"
                  onClick={() => void handleSkipAll()}
                  className="cursor-pointer text-(--form-text-muted) underline-offset-2 transition-colors hover:text-(--form-text-primary) hover:underline"
                >
                  Skip all
                </button>
              )}
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
        <footer className="sticky bottom-0 z-20 border-t border-white/6 bg-[color-mix(in_srgb,var(--form-bg)_80%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2 text-xs text-(--form-ai-accent)">
              <Loader2 className="size-3.5 animate-spin" />
              AI is thinking…
            </div>
            <div className="flex items-center gap-2">
              {remainingFollowups > 1 && (
                <Button
                  type="button"
                  onClick={() => void handleSkipAll()}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-xs text-(--form-text-muted) transition-colors hover:text-(--form-text-primary)"
                >
                  Skip all
                </Button>
              )}
              {currentDebriefField && (
                <Button
                  type="button"
                  onClick={() => void handleDebriefAnswer(currentDebriefField.id, null)}
                  className="cursor-pointer rounded-full border border-white/8 px-3 py-1.5 text-xs text-(--form-text-muted) transition-colors hover:border-white/20 hover:text-(--form-text-primary)"
                >
                  Skip
                </Button>
              )}
            </div>
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
  initialValue?: unknown;
  onSubmit: (value: unknown) => void;
};

function ReplyArea({ field, disabled, pending, initialValue, onSubmit }: ReplyAreaProps) {
  const initialText =
    initialValue == null || initialValue === "" ? "" : String(initialValue);
  switch (field.type) {
    case "long_text":
      return (
        <LongTextReply
          field={field}
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "single_choice":
      return <SingleChoiceReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "multiple_choice":
      return (
        <MultipleChoiceReply
          field={field}
          disabled={disabled}
          pending={pending}
          initialValue={Array.isArray(initialValue) ? (initialValue as string[]) : []}
          onSubmit={onSubmit}
        />
      );
    case "rating":
      return <RatingReply field={field} disabled={disabled} onSubmit={onSubmit} />;
    case "date":
      return (
        <TextReply
          field={field}
          inputType="date"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "email":
      return (
        <TextReply
          field={field}
          inputType="email"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    case "number":
      return (
        <TextReply
          field={field}
          inputType="number"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
    default:
      return (
        <TextReply
          field={field}
          inputType="text"
          disabled={disabled}
          initialValue={initialText}
          onSubmit={onSubmit}
        />
      );
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
        className="max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/8 bg-(--form-surface) px-4 py-2.5 text-[15px] leading-relaxed text-(--form-text-primary) outline-none transition-colors field-sizing-content placeholder:text-(--form-text-muted) focus:border-[color-mix(in_srgb,var(--form-accent)_50%,transparent)] disabled:opacity-50"
      />
      <Button
        type="button"
        onClick={onSkip}
        disabled={pending}
        className="cursor-pointer shrink-0 rounded-full px-3 py-2 text-xs transition-all disabled:opacity-40"
      >
        Skip
      </Button>
      <Button
        type="submit"
        disabled={pending || !value.trim()}
        aria-label="Send reply"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--form-accent) text-(--form-text-on-accent) transition-all hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
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
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--form-accent) text-(--form-text-on-accent) transition-all hover:bg-[color-mix(in_srgb,var(--form-accent)_90%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
    </Button>
  );
}

const TEXT_INPUT_CLASS =
  "min-w-0 flex-1 rounded-full border border-white/[0.08] bg-[var(--form-surface)] px-4 py-2.5 text-[15px] text-[var(--form-text-primary)] outline-none transition-colors placeholder:text-[var(--form-text-muted)] focus:border-[color-mix(in_srgb,var(--form-accent)_50%,transparent)] disabled:opacity-50";

function TextReply({
  field,
  inputType,
  disabled,
  initialValue = "",
  onSubmit,
}: {
  field: Field;
  inputType: string;
  disabled: boolean;
  initialValue?: string;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(initialValue);
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
        className={cn(TEXT_INPUT_CLASS, "scheme-dark")}
      />
      <SendButton disabled={disabled} />
    </form>
  );
}

function LongTextReply({
  field,
  disabled,
  initialValue = "",
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  initialValue?: string;
  onSubmit: (v: unknown) => void;
}) {
  const [value, setValue] = useState(initialValue);
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
        className="max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-white/8 bg-(--form-surface) px-4 py-2.5 text-[15px] leading-relaxed text-(--form-text-primary) outline-none transition-colors field-sizing-content placeholder:text-(--form-text-muted) focus:border-[color-mix(in_srgb,var(--form-accent)_50%,transparent)] disabled:opacity-50"
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
          className="cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--form-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--form-accent)_6%,transparent)] px-4 py-2 text-sm text-(--form-text-primary) transition-all hover:border-(--form-accent) hover:bg-[color-mix(in_srgb,var(--form-accent)_15%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
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
  initialValue,
  onSubmit,
}: {
  field: Field;
  disabled: boolean;
  pending: boolean;
  initialValue?: string[];
  onSubmit: (v: unknown) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialValue ?? []);
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
                  ? "border-(--form-accent) bg-(--form-accent) text-(--form-text-on-accent)"
                  : "border-[color-mix(in_srgb,var(--form-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--form-accent)_6%,transparent)] text-(--form-text-primary) hover:border-(--form-accent) hover:bg-[color-mix(in_srgb,var(--form-accent)_15%,transparent)]",
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <SendButton
          disabled={disabled || (field.required && selected.length === 0)}
          pending={pending}
        />
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
                ? "border-(--form-accent) bg-[color-mix(in_srgb,var(--form-accent)_15%,transparent)] text-(--form-accent)"
                : "border-white/8 bg-(--form-surface) text-(--form-text-muted) hover:border-[color-mix(in_srgb,var(--form-accent)_50%,transparent)]",
            )}
          >
            {style === "star" ? (
              <Star className={cn("size-5", active && "fill-(--form-accent)")} />
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

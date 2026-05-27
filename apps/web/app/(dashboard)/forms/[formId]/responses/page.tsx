"use client";

import { use, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Inbox, ArrowLeft, Sparkles, Clock, Hash } from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const q = trpc.forms.responses.list.useQuery({ formId });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns: { fieldId: string; label: string }[] = [];
  const seenFieldIds = new Set<string>();
  for (const response of q.data ?? []) {
    for (const answer of response.answers) {
      if (!seenFieldIds.has(answer.fieldId)) {
        seenFieldIds.add(answer.fieldId);
        columns.push({ fieldId: answer.fieldId, label: answer.label });
      }
    }
  }

  const responses = q.data ?? [];
  const count = responses.length;
  const selected = responses.find((r) => r.id === selectedId) ?? responses[0] ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className="flex items-center gap-1.5 text-xs text-[#6B6B6B] transition-colors duration-200 hover:text-[#F2F2F2]"
          >
            <ArrowLeft className="size-3.5" />
            Back to editor
          </Link>
          <span className="text-[#3A3A3A] text-xs">·</span>
          <FormTabs formId={formId} active="responses" />
          {!q.isPending && (
            <span className="rounded-full border border-[#E8854A]/20 bg-[#E8854A]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E8854A]">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {q.isPending ? (
          <div className="flex w-full">
            <div className="w-full shrink-0 border-r border-white/[0.07] p-3 lg:w-[300px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-2 rounded-xl p-4" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-5 animate-shimmer rounded-md bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                    <div className="h-2.5 w-16 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                  </div>
                  <div className="h-3 w-3/4 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
            <div className="flex-1 p-8">
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] p-5 space-y-3">
                    <div className="h-2.5 w-32 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                    <div className="h-4 w-2/3 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-[#E8854A]/30">
              <Inbox className="size-6 text-[#3A3A3A]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tracking-tight text-[#3A3A3A]">No responses yet</p>
              <p className="text-xs text-[#6B6B6B]">
                Responses will appear here once people submit your form
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT — master list */}
            <div
              className={cn(
                "shrink-0 overflow-y-auto border-white/[0.07] p-3",
                "lg:w-[300px] lg:border-r",
                selectedId ? "hidden lg:block" : "block w-full",
              )}
            >
              {responses.map((response, i) => {
                const isSelected = selected?.id === response.id;
                const firstAnswer = response.answers[0];
                const preview = firstAnswer ? renderValue(firstAnswer.value) : null;
                const idx = responses.length - i;

                return (
                  <button
                    type="button"
                    key={response.id}
                    onClick={() => setSelectedId(response.id)}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    className={cn(
                      "animate-fade-up group relative mb-1.5 w-full rounded-xl px-4 py-3.5 text-left transition-all duration-200",
                      isSelected
                        ? "bg-white/[0.06] ring-1 ring-white/[0.1]"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Index + timestamp row */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className={cn(
                        "flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors duration-200",
                        isSelected
                          ? "bg-[#E8854A]/20 text-[#E8854A]"
                          : "bg-white/[0.05] text-[#4A4A4A] group-hover:text-[#6B6B6B]",
                      )}>
                        #{idx}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-2.5 text-[#4A4A4A]" />
                        <span className="font-mono text-[10px] text-[#4A4A4A]">
                          {response.completedAt
                            ? formatDistanceToNow(new Date(response.completedAt), { addSuffix: true })
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Preview */}
                    {preview ? (
                      <p className={cn(
                        "truncate text-xs leading-relaxed transition-colors duration-200",
                        isSelected ? "text-[#D4D4D4]" : "text-[#6B6B6B] group-hover:text-[#9B9B9B]",
                      )}>
                        {preview}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#3A3A3A] italic">No answers</p>
                    )}

                    {/* Selected accent bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#E8854A]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT — detail */}
            <div
              className={cn(
                "overflow-y-auto",
                "lg:flex-1",
                selectedId ? "block w-full" : "hidden lg:block lg:flex-1",
              )}
            >
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1.5 px-6 pt-5 text-xs text-[#6B6B6B] transition-colors duration-200 hover:text-[#F2F2F2] lg:hidden"
                >
                  <ArrowLeft className="size-3.5" />
                  All responses
                </button>
              )}

              {selected && (
                <div key={selected.id} className="animate-fade-up px-7 py-6">
                  {/* Response meta header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="size-3 text-[#4A4A4A]" />
                        <span className="font-mono text-xs font-semibold text-[#6B6B6B]">
                          {responses.length - responses.findIndex(r => r.id === selected.id)}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-white/[0.1]" />
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-[#4A4A4A]" />
                        <span className="font-mono text-xs text-[#6B6B6B]">
                          {selected.completedAt
                            ? format(new Date(selected.completedAt), "MMM d, yyyy · h:mm a")
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Answer cards */}
                  <div className="space-y-3">
                    {columns.map((col, idx) => {
                      const answer = selected.answers.find((a) => a.fieldId === col.fieldId);
                      const value = answer ? renderValue(answer.value) : null;

                      return (
                        <div
                          key={col.fieldId}
                          className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]"
                        >
                          {/* Question label */}
                          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4A4A4A]">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/[0.05] font-mono text-[9px] text-[#3A3A3A]">
                              {idx + 1}
                            </span>
                            {col.label}
                          </p>

                          {/* Answer value */}
                          {value ? (
                            <p className="break-words text-sm leading-relaxed text-[#E8E8E8]">
                              {value}
                            </p>
                          ) : (
                            <p className="font-mono text-xs text-[#3A3A3A] italic">No answer</p>
                          )}

                          {/* AI followup */}
                          {answer?.followup && (
                            <div className="mt-4 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.05] p-4">
                              <div className="mb-2 flex items-center gap-1.5">
                                <Sparkles className="size-3 text-[#9B6DFF]" aria-hidden="true" />
                                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#7C5CBF]">
                                  AI follow-up
                                </span>
                              </div>
                              <p className="mb-3 text-xs leading-relaxed text-[#8B8B8B]">
                                {answer.followup.aiQuestion}
                              </p>
                              {answer.followup.userAnswer ? (
                                <p className="break-words text-sm leading-relaxed text-[#E8E8E8]">
                                  {answer.followup.userAnswer}
                                </p>
                              ) : (
                                <span className="font-mono text-[10px] italic text-[#3A3A3A]">
                                  Skipped
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

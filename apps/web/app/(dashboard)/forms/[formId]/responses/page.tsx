"use client";

import { use, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Inbox, ArrowLeft, Sparkles } from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

const EASE = "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

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

  // Build ordered union of columns from all responses
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

  const selected =
    responses.find((r) => r.id === selectedId) ?? responses[0] ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] text-[#F2F2F2]">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className={cn(
              "flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#F2F2F2]",
              EASE,
            )}
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
            {/* Skeleton list */}
            <div className="w-full shrink-0 border-r border-white/[0.07] p-2 lg:w-[320px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-1 rounded-lg p-3"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2 h-3 w-20 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                  <div className="h-3 w-40 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
            <div className="flex-1 p-8">
              <div className="space-y-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2.5 w-24 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
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
              <p className="text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                No responses yet
              </p>
              <p className="text-xs text-[#6B6B6B]">
                Responses will appear here once people submit your form
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT — master list (full width on mobile when no selection, 320px on lg) */}
            <div
              className={cn(
                "shrink-0 overflow-y-auto border-white/[0.07] py-2",
                "lg:w-[320px] lg:border-r",
                selectedId ? "hidden lg:block" : "block w-full",
              )}
            >
              {responses.map((response, i) => {
                const isSelected = selected?.id === response.id;
                const first = response.answers[0];
                const preview = first ? renderValue(first.value) : "No answers";
                return (
                  <button
                    key={response.id}
                    onClick={() => setSelectedId(response.id)}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                    className={cn(
                      "animate-fade-up relative flex w-full flex-col gap-1 border-l-2 px-5 py-3 text-left",
                      EASE,
                      isSelected
                        ? "border-l-[#E8854A] bg-white/[0.03]"
                        : "border-l-transparent hover:bg-white/[0.02]",
                    )}
                  >
                    <span className="font-mono text-[11px] text-[#6B6B6B]">
                      {response.completedAt
                        ? formatDistanceToNow(new Date(response.completedAt), {
                            addSuffix: true,
                          })
                        : "—"}
                    </span>
                    <span
                      className={cn(
                        "truncate text-sm",
                        isSelected ? "text-[#F2F2F2]" : "text-[#F2F2F2]/80",
                      )}
                    >
                      {preview}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT — detail (full width on mobile when selection exists, flex-1 on lg) */}
            <div
              className={cn(
                "overflow-y-auto",
                "lg:flex-1",
                selectedId ? "block w-full" : "hidden lg:block lg:flex-1",
              )}
            >
              {/* Mobile back button */}
              {selectedId && (
                <button
                  onClick={() => setSelectedId(null)}
                  className={cn(
                    "flex items-center gap-1.5 px-6 pt-5 text-xs text-[#6B6B6B] hover:text-[#F2F2F2] lg:hidden",
                    EASE,
                  )}
                >
                  <ArrowLeft className="size-3.5" />
                  All responses
                </button>
              )}
              {selected && (
                <div key={selected.id} className="animate-fade-up px-8 py-7">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                      Submitted
                    </span>
                    <span className="font-mono text-xs text-[#F2F2F2]">
                      {selected.completedAt
                        ? formatDistanceToNow(new Date(selected.completedAt), {
                            addSuffix: true,
                          })
                        : "—"}
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.06]">
                    {columns.map((col) => {
                      const answer = selected.answers.find((a) => a.fieldId === col.fieldId);
                      return (
                        <div key={col.fieldId} className="py-4">
                          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[#6B6B6B]">
                            {col.label}
                          </p>
                          {answer ? (
                            <>
                              <p className="break-words text-sm leading-relaxed text-[#F2F2F2]">
                                {renderValue(answer.value)}
                              </p>
                              {answer.followup && (
                                <div className="mt-3 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.06] p-3">
                                  <div className="mb-1.5 flex items-center gap-1.5">
                                    <Sparkles className="size-3 text-[#7C3AED]" aria-hidden="true" />
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#7C3AED]">
                                      AI asked
                                    </span>
                                  </div>
                                  <p className="mb-2 text-xs leading-relaxed text-[#9B9B9B]">
                                    {answer.followup.aiQuestion}
                                  </p>
                                  {answer.followup.userAnswer ? (
                                    <p className="break-words text-sm leading-relaxed text-[#F2F2F2]">
                                      {answer.followup.userAnswer}
                                    </p>
                                  ) : (
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#3A3A3A]">
                                      Skipped
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="font-mono text-sm text-[#3A3A3A]">—</p>
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

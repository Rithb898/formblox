"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw, Inbox } from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";
import { FormTabs } from "../_components/form-tabs";

const EASE = "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

export default function SummaryPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const q = trpc.forms.responses.summaryData.useQuery({ formId });

  const [summary, setSummary] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasGeneratedRef = useRef(false);

  async function generate() {
    if (!q.data || q.data.responseCount === 0) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStreaming(true);
    setSummary("");
    setError(false);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q.data),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setError(true);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        if (ctrl.signal.aborted) return;
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSummary(text);
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setError(true);
    } finally {
      setStreaming(false);
    }
  }

  // Auto-generate once data loads
  useEffect(() => {
    if (q.data && q.data.responseCount > 0 && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);

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
          <FormTabs formId={formId} active="summary" />
        </div>

        {q.data && q.data.responseCount > 0 && !q.isPending && (
          <button
            onClick={() => void generate()}
            disabled={streaming}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              "bg-[#7C3AED]/10 text-[#A78BFA] ring-1 ring-[#7C3AED]/20",
              EASE,
              "hover:bg-[#7C3AED]/20 disabled:opacity-50 disabled:pointer-events-none",
            )}
          >
            <RefreshCw className={cn("size-3", streaming && "animate-spin")} />
            Regenerate
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-y-auto px-8 py-8">
        {q.isPending ? (
          <div className="space-y-4 max-w-2xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-shimmer rounded bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
                style={{ width: `${60 + (i % 3) * 20}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : !q.data || q.data.responseCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-[#7C3AED]/30">
              <Inbox className="size-6 text-[#3A3A3A]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-2xl font-semibold tracking-tight text-[#3A3A3A]">
                No responses yet
              </p>
              <p className="text-xs text-[#6B6B6B]">
                Share your form to start collecting responses, then come back for an AI summary.
              </p>
            </div>
          </div>
        ) : error && !summary ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-sm text-[#6B6B6B]">Couldn't generate summary. Try again.</p>
            <button
              onClick={() => void generate()}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium",
                "bg-[#7C3AED]/10 text-[#A78BFA] ring-1 ring-[#7C3AED]/20 hover:bg-[#7C3AED]/20",
                EASE,
              )}
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Meta row */}
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="size-4 text-[#7C3AED]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#7C3AED]">
                AI Summary
              </span>
              <span className="font-mono text-[11px] text-[#3A3A3A]">·</span>
              <span className="font-mono text-[11px] text-[#6B6B6B]">
                {q.data.responseCount} response{q.data.responseCount === 1 ? "" : "s"} analysed
              </span>
            </div>

            {/* Summary text */}
            <div
              className={cn(
                "rounded-2xl border border-[#7C3AED]/10 bg-[#7C3AED]/[0.04] p-6",
                "text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-wrap",
              )}
            >
              {summary || (
                <span className="flex items-center gap-2 text-[#6B6B6B]">
                  <span className="inline-flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span
                        key={i}
                        className="size-1.5 rounded-full bg-[#7C3AED]/60 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                  Generating summary…
                </span>
              )}
              {streaming && summary && (
                <span className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-[#A78BFA]" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

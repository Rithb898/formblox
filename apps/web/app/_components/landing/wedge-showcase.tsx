"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Check, TrendingDown } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function WedgeShowcase() {
  const [step, setStep] = useState(0);

  // Cycle the conversational simulation steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 4) return 0;
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <section id="wedge" className="px-4 py-20 relative">
      {/* Absolute glow flare behind the comparison grid */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8854A] opacity-[0.035] blur-[140px]" />

      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full border border-[#E8854A]/25 bg-[#E8854A]/5 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#E8854A]">
              <Sparkles className="size-3 animate-pulse text-[#E8854A]" />
              <span>The Differentiator</span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              Forms that talk back.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#8E8E93]">
              Static forms miss crucial details. FormBlox uses dynamic AI auto-follow ups to interview your respondents, capturing granular insights while doubling completion rates.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* COLUMN A: Traditional Static Form (Legacy) */}
          <ScrollReveal delay={0.1} className="h-full">
            <div className="group relative rounded-[2rem] bg-white/[0.01] p-1.5 ring-1 ring-white/[0.04] h-full flex flex-col justify-between">
              {/* Inner card */}
              <div className="relative flex-grow rounded-[calc(2rem-6px)] bg-[#0d0d0d] border border-white/[0.01] p-6 flex flex-col justify-between min-h-[420px]">
                <div>
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-3 mb-6">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Traditional Form</span>
                    <span className="font-mono text-[9px] text-zinc-600 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.03]">Static</span>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase">1. Full Name</label>
                      <div className="w-full rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
                        Elena Vasquez
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase">2. Cancellation Reason</label>
                      <div className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-white">
                        "The dashboard loading speed is slow."
                      </div>
                    </div>
                    <div className="space-y-1 opacity-40">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase">3. What was slow?</label>
                      <div className="w-full rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2 text-xs text-zinc-600 italic">
                        No field provided to ask context...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom telemetry card */}
                <div className="mt-8 border-t border-white/[0.04] pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                    <TrendingDown className="size-3.5 text-red-500/80" />
                    <span>Average Completion</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-zinc-400">
                    34%
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* COLUMN B: FormBlox AI Conversational (The Wedge) */}
          <ScrollReveal delay={0.2} className="h-full">
            <div
              onMouseMove={handleMouseMove}
              className="group relative rounded-[2rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] hover:ring-white/[0.12] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] h-full flex flex-col justify-between"
            >
              {/* Spotlight border overlay — radial gradient follows cursor */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(280px circle at var(--mx) var(--my), rgba(232,133,74,0.12), transparent 45%)",
                }}
              />

              {/* Inner card */}
              <div className="relative flex-grow rounded-[calc(2rem-6px)] bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02] p-6 flex flex-col justify-between min-h-[420px]">
                <div>
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-6">
                    <span className="font-mono text-[10px] text-[#E8854A] uppercase tracking-wider font-semibold">FormBlox Workspace</span>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#E8854A] bg-[#E8854A]/5 px-2 py-0.5 rounded border border-[#E8854A]/10">
                      <span className="size-1.5 rounded-full bg-[#E8854A] animate-pulse" />
                      <span>AI Enabled</span>
                    </div>
                  </div>

                  {/* Chat message simulation */}
                  <div className="space-y-3.5 text-left text-xs">
                    {/* Step 0: Initial Question */}
                    <div className="flex items-end gap-2.5 max-w-[85%]">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] border border-[#E8854A]/15 font-mono text-[10px] font-semibold">
                        F
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-zinc-300">
                        What is your primary product feedback?
                      </div>
                    </div>

                    {/* Step 1: User Response */}
                    {step >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex items-end gap-2.5 max-w-[85%] ml-auto justify-end"
                      >
                        <div className="rounded-2xl rounded-br-sm border border-[#E8854A]/25 bg-[#E8854A]/8 px-3.5 py-2.5 text-[#F2F2F2]">
                          "The dashboard loading speed is slow."
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: AI Follow-Up analyzing typing bounce */}
                    {step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-2.5 max-w-[85%]"
                      >
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] font-mono text-[10px] font-semibold border border-[#E8854A]/15">
                          F
                        </div>
                        <div className="rounded-2xl rounded-bl-sm border border-[#E8854A]/15 bg-[#E8854A]/4 px-3.5 py-3 flex gap-1 items-center">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={dot}
                              className="size-1.5 animate-bounce rounded-full bg-[#E8854A]/70"
                              style={{ animationDelay: `${dot * 150}ms` }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: AI Dynamic Follow-up bubble */}
                    {step >= 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-2.5 max-w-[88%]"
                      >
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] font-mono text-[10px] font-semibold border border-[#E8854A]/15">
                          F
                        </div>
                        <div className="rounded-2xl rounded-bl-sm border border-[#E8854A]/30 bg-[#E8854A]/4 p-3.5 text-zinc-300 relative shadow-md">
                          <div className="flex items-center gap-1 mb-1 font-mono text-[8px] text-[#E8854A] font-semibold uppercase tracking-wider">
                            <Sparkles className="size-2.5 text-[#E8854A] animate-pulse" />
                            <span>AI Auto-Follow Up</span>
                          </div>
                          I see. Is it the chart rendering, database queries, or general page load that feels slow?
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: User Follow-up Answer */}
                    {step >= 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex items-end gap-2.5 max-w-[85%] ml-auto justify-end"
                      >
                        <div className="rounded-2xl rounded-br-sm border border-[#E8854A]/25 bg-[#E8854A]/8 px-3.5 py-2.5 text-[#F2F2F2]">
                          "Mainly the database queries on reload."
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Bottom telemetry card */}
                <div className="mt-8 border-t border-white/[0.05] pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[#E8854A] font-mono text-[10px] font-semibold">
                    <Check className="size-3.5 text-[#E8854A]" />
                    <span>Average Completion</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#E8854A] bg-[#E8854A]/8 border border-[#E8854A]/15 px-2 py-0.5 rounded-full">
                    78%
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

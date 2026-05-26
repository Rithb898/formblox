"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal } from "./scroll-reveal";

export function FinalCta() {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <section className="px-4 pb-24 pt-8 relative">
      <ScrollReveal>
        <div
          onMouseMove={handleMouseMove}
          className="group relative mx-auto max-w-4xl rounded-[2rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12]"
        >
          {/* Spotlight border overlay — radial gradient follows cursor */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(350px circle at var(--mx) var(--my), rgba(232,133,74,0.12), transparent 45%)",
            }}
          />

          {/* Inner card core */}
          <div className="relative rounded-[calc(2rem-6px)] bg-[#111] overflow-hidden px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02]">
            {/* Background elements */}
            <div
              className="pointer-events-none absolute inset-0 -z-10 select-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Glowing halos */}
            <div className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-[#E8854A]/8 opacity-40 blur-[80px]" />
            <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-[#174c4c]/15 opacity-40 blur-[80px]" />

            {/* Capsule Feature Badge */}
            <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full border border-[#E8854A]/20 bg-[#E8854A]/5 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#E8854A]">
              <Sparkles className="size-3 text-[#E8854A]" />
              <span>Deploy Instantly</span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              Start building in 60 seconds.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[#8E8E93]">
              Experience conversational UI that captures deeper answers. Get started with our 3-Pane Editor and AI features today.
            </p>

            <div className="mt-8 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative inline-flex items-center justify-center rounded-full p-px font-medium"
              >
                {/* Outward glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E8854A] via-[#ffaa75] to-[#E8854A] opacity-70 blur-[3px]" />
                
                <Link
                  href="/signup"
                  className="relative flex items-center gap-2 rounded-full bg-[#E8854A] px-8 py-3 text-sm font-semibold text-[#0a0a0a] transition-all duration-300 hover:bg-[#E8854A]/95 overflow-hidden group/btn"
                >
                  {/* Shimmer sweep reflection on hover */}
                  <div className="absolute -inset-y-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[30deg] transition-all duration-1000 ease-out group-hover/btn:left-[150%]" />
                  
                  <span>Start building free</span>
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

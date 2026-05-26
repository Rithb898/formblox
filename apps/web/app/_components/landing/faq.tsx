"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollReveal } from "./scroll-reveal";

const items = [
  {
    question: "Is this a normal form builder?",
    answer: "It stores structured answers, but the respondent experience feels like a chat.",
  },
  {
    question: "Can I share forms publicly?",
    answer: "Yes. Published forms get a public `/f/...` link while the dashboard stays protected.",
  },
  {
    question: "Does the landing demo submit real data?",
    answer: "No. The landing preview is staged so people can understand the interaction quickly.",
  },
  {
    question: "Can I embed forms on my website?",
    answer: "You can share a public link that opens in a dedicated page. Embed support is on the roadmap.",
  },
  {
    question: "Is there a free tier?",
    answer: "FormBlox is free during the beta. Pricing will be announced before any paid plans launch.",
  },
  {
    question: "Can I export responses to CSV?",
    answer: "Direct CSV and JSON export are scheduled on our immediate features roadmap. You can view and manage all submissions in real-time within your Responses dashboard.",
  },
];

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof items)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative cursor-pointer rounded-2xl bg-white/[0.02] p-1 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12] mb-3.5 select-none"
      onClick={onToggle}
    >
      {/* Spotlight border overlay — radial gradient follows cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(150px circle at var(--mx) var(--my), rgba(232,133,74,0.1), transparent 45%)",
        }}
      />

      {/* Inner card core */}
      <div className="relative rounded-[0.95rem] bg-[#111] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight text-[#F2F2F2] transition-colors duration-300 group-hover:text-white">
            {item.question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`flex size-6 items-center justify-center rounded-full border transition-colors duration-300 ${
              isOpen
                ? "border-[#E8854A]/30 bg-[#E8854A]/10 text-[#E8854A]"
                : "border-white/[0.06] bg-white/[0.02] text-zinc-500 group-hover:text-zinc-300"
            }`}
          >
            <ChevronDown className="size-3.5" />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 text-[13px] leading-relaxed text-[#8E8E93] border-t border-white/[0.03] mt-3">
                {item.answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // open first by default

  return (
    <section id="faq" className="px-4 py-20 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute right-1/4 bottom-1/4 -z-10 h-64 w-64 rounded-full bg-[#174c4c]/4 opacity-[0.4] blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              Frequently Asked Questions.
            </h2>
            <p className="mt-3 text-sm text-[#6B6B6B] max-w-md mx-auto">
              Everything you need to know about building, sharing, and optimizing FormBlox.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-col">
            {items.map((item, idx) => (
              <FaqItem
                key={item.question}
                item={item}
                isOpen={openIndex === idx}
                onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

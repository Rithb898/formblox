"use client";

import {
  BarChart3,
  ListChecks,
  MousePointer2,
  Sparkles,
  RefreshCw,
  Type,
  Star,
  ToggleLeft,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { motion } from "motion/react";

function BuildCardPlaceholder() {
  return (
    <div className="mt-6 border border-white/[0.04] bg-[#0c0c0c]/80 rounded-xl p-3 flex flex-col md:flex-row gap-3 min-h-[140px] text-left">
      {/* Pane 1: Palette */}
      <div className="w-full md:w-1/3 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-white/[0.04] pb-2 md:pb-0 md:pr-2.5">
        <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-wider mb-1 block">
          Palette
        </span>
        {[
          { label: "Short text", icon: Type },
          { label: "Rating Scale", icon: Star },
          { label: "Toggle Switch", icon: ToggleLeft },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.01] px-2 py-1 text-[8px] text-[#6B6B6B]"
            >
              <Icon className="size-2.5 text-[#E8854A]/80" />
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>
      {/* Pane 2: Canvas */}
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        <span className="font-mono text-[7px] text-zinc-500 uppercase tracking-wider mb-0.5">
          Canvas Workspace
        </span>
        <div className="rounded-lg border border-[#E8854A]/30 bg-[#E8854A]/4 px-2.5 py-1.5 text-[8px] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-[#E8854A]/10 text-[#E8854A] flex items-center justify-center font-mono text-[7px] font-semibold border border-[#E8854A]/25">
              1
            </span>
            <span className="text-white font-medium truncate">Onboarding Survey</span>
          </div>
          <span className="size-1.5 bg-[#E8854A] rounded-full animate-pulse" />
        </div>
        <p className="text-[7.5px] text-zinc-500 font-mono">explicit_save: CMD+S active</p>
      </div>
    </div>
  );
}

function RunnerCardPlaceholder() {
  return (
    <div className="mt-6 border border-white/[0.04] bg-[#0c0c0c]/90 rounded-xl p-3.5 flex flex-col justify-between min-h-[140px] text-left">
      <div className="flex justify-between items-center text-[7px] text-zinc-500 font-mono border-b border-white/[0.04] pb-1.5">
        <span>formblox.app/f/onboarding</span>
        <span className="text-[#E8854A] font-semibold bg-[#E8854A]/10 px-1.5 py-0.5 rounded-full">
          92% Done
        </span>
      </div>
      <div className="py-2.5 space-y-1">
        <p className="text-[8px] text-zinc-500 font-mono">Question 2 of 3</p>
        <p className="text-[11px] font-semibold text-white leading-tight">
          What is your primary onboarding goal?
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded-lg border border-[#E8854A]/40 bg-[#E8854A]/8 px-2.5 py-1.5 text-[8px] font-semibold text-[#E8854A]">
          Growth ↵
        </span>
        <span className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-2.5 py-1.5 text-[8px] text-zinc-500">
          Retention
        </span>
      </div>
    </div>
  );
}

function FollowUpCardPlaceholder() {
  return (
    <div className="mt-6 space-y-3.5 text-left min-h-[140px] flex flex-col justify-center">
      {/* User Answer */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-2.5 relative">
        <p className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1.5">
          Open-Text Answer
        </p>
        <p className="text-[9.5px] text-white">"We need to collect leads on our landing page."</p>
      </div>
      {/* AI Follow-Up node */}
      <div className="rounded-xl border-l-2 border-[#E8854A] bg-[#E8854A]/4 p-2.5 relative shadow-md">
        <div className="flex items-center gap-1.5 mb-1 text-[7px] font-mono text-[#E8854A] uppercase tracking-wider font-semibold">
          <Sparkles className="size-2.5 text-[#E8854A] animate-pulse" />
          <span>AI Auto Follow-Up</span>
        </div>
        <p className="text-[9.5px] leading-relaxed text-zinc-300">
          "What specific lead information is critical besides emails?"
        </p>
      </div>
    </div>
  );
}

function GeneratorCardPlaceholder() {
  return (
    <div className="mt-6 space-y-3 text-left min-h-[140px] flex flex-col justify-center">
      {/* User Prompt */}
      <div className="rounded-xl border border-dashed border-white/[0.08] p-2.5 bg-white/[0.01]">
        <p className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1.5">
          AI Prompt
        </p>
        <p className="text-[9.5px] text-[#E8854A] font-semibold">
          "Create a customer checkout survey"
        </p>
      </div>
      {/* Compiling schemas */}
      <div className="flex gap-2">
        {["1. Rating", "2. Choice"].map((step, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-lg border border-white/[0.04] bg-[#0c0c0c] px-2 py-1.5 text-[8px] font-mono text-zinc-400 flex items-center justify-between"
          >
            <span>{step}</span>
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsCardPlaceholder() {
  return (
    <div className="mt-6 space-y-2.5 text-left min-h-[140px] flex flex-col justify-center">
      <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 leading-none mb-1">
        <span>Funnel Conversion</span>
        <span className="text-[#E8854A] font-semibold">92% Avg</span>
      </div>
      {/* Funnel bars */}
      <div className="space-y-2">
        {[
          { label: "Q1 Name", width: "94%", color: "bg-[#E8854A]" },
          { label: "Q2 Company", width: "82%", color: "bg-[#E8854A]/80" },
          { label: "Q3 Urgency", width: "68%", color: "bg-[#E8854A]/60" },
        ].map((bar, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between text-[7px] font-mono text-zinc-500">
              <span>{bar.label}</span>
              <span>{bar.width}</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden p-px border border-white/[0.03]">
              <div className={`h-full ${bar.width} ${bar.color} rounded-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type BentoCard = {
  title: string;
  meta: string;
  icon: any;
  span: string;
  renderPlaceholder: () => React.ReactNode;
};

function MockBentoCard({ card, index }: { card: BentoCard; index: number }) {
  const Icon = card.icon;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${card.span} group relative cursor-default rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12] col-span-1`}
    >
      {/* Spotlight border overlay — radial gradient follows cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(180px circle at var(--mx) var(--my), rgba(232,133,74,0.12), transparent 45%)",
        }}
      />

      {/* Inner card core */}
      <div className="relative min-h-56 overflow-hidden rounded-[1.4rem] bg-[#111] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02] flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-[#F2F2F2]">{card.title}</p>
            <p className="mt-0.5 font-mono text-[9px] text-[#6B6B6B] leading-none uppercase tracking-wide">
              {card.meta}
            </p>
          </div>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/10 text-[#E8854A] ring-1 ring-[#E8854A]/20">
            <Icon className="size-3.5" />
          </div>
        </div>

        {card.renderPlaceholder()}
      </div>
    </div>
  );
}

export function ProductBento() {
  const cards: BentoCard[] = [
    {
      title: "3-Pane Visual Editor",
      meta: "Slice 1: Custom canvas schema",
      icon: ListChecks,
      span: "md:col-span-7",
      renderPlaceholder: () => <BuildCardPlaceholder />,
    },
    {
      title: "Conversational Runner",
      meta: "Slice 4: Typeform-style UX",
      icon: MousePointer2,
      span: "md:col-span-5",
      renderPlaceholder: () => <RunnerCardPlaceholder />,
    },
    {
      title: "AI Auto-Follow Up",
      meta: "Slice 5: Forms that ask back",
      icon: Sparkles,
      span: "md:col-span-4",
      renderPlaceholder: () => <FollowUpCardPlaceholder />,
    },
    {
      title: "Generate with AI",
      meta: "Slice 7: Prompt to JSON schema",
      icon: RefreshCw,
      span: "md:col-span-4",
      renderPlaceholder: () => <GeneratorCardPlaceholder />,
    },
    {
      title: "Funnel Analytics",
      meta: "Slice 10: Step drop-off funnel",
      icon: BarChart3,
      span: "md:col-span-4",
      renderPlaceholder: () => <AnalyticsCardPlaceholder />,
    },
  ];

  return (
    <section id="workflow" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              Workflow Ecosystem
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              From blank form to AI follow-up.
            </h2>
          </div>
        </ScrollReveal>

        {/* 5-Card Asymmetric Bento Layout Grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
          {cards.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 0.08} className={card.span}>
              <MockBentoCard card={card} index={index} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

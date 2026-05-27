"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { useInView } from "motion/react";
import {
  Type,
  Star,
  ToggleLeft,
  CheckCircle2,
  Globe,
  TrendingUp,
  FileText,
  Inbox,
} from "lucide-react";

type StatItem = {
  label: string;
  value: number;
  suffix: string;
  renderGraphic: () => React.ReactNode;
};

function AnimatedNumber({
  value,
  suffix,
  hasRun,
}: {
  value: number;
  suffix: string;
  hasRun: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!hasRun) return;

    const target = value;
    const duration = 1600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasRun, value]);

  return (
    <span className="font-mono tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function MockStatCard({ stat, hasRun, index }: { stat: StatItem; hasRun: boolean; index: number }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group relative cursor-default rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12] col-span-1"
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

      {/* Inner core */}
      <div className="relative flex h-full min-h-[11rem] flex-col justify-between overflow-hidden rounded-[1.4rem] bg-[#111] p-6 border border-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] text-center">
        <div>
          <p className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
            <AnimatedNumber value={stat.value} suffix={stat.suffix} hasRun={hasRun} />
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6B6B6B] leading-none">
            {stat.label}
          </p>
        </div>

        {/* Visual Infographics */}
        {stat.renderGraphic()}
      </div>
    </div>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const stats: StatItem[] = [
    {
      label: "Field types",
      value: 8,
      suffix: "",
      renderGraphic: () => (
        <div className="mt-3.5 flex gap-2 justify-center">
          {[Type, Star, ToggleLeft].map((Icon, idx) => (
            <div
              key={idx}
              className="flex size-7 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] text-[#E8854A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
            >
              <Icon className="size-3.5" />
            </div>
          ))}
          <div className="flex size-7 items-center justify-center rounded-xl bg-[#E8854A]/10 border border-[#E8854A]/20 text-[#E8854A] font-mono text-[9px] font-semibold leading-none">
            +5
          </div>
        </div>
      ),
    },
    {
      label: "Instant Deploy",
      value: 1,
      suffix: " Click",
      renderGraphic: () => (
        <div className="mt-3.5 flex justify-center items-center bg-white/[0.01] border border-white/[0.04] px-2.5 py-1.5 rounded-xl h-8">
          <span className="font-mono text-[8px] text-zinc-500 flex items-center gap-1 leading-none">
            <span className="size-1 bg-[#E8854A] rounded-full animate-pulse" />
            public slug
          </span>
          <Globe className="size-3.5 text-[#E8854A] animate-pulse" />
        </div>
      ),
    },
    {
      label: "Avg completion",
      value: 92,
      suffix: "%",
      renderGraphic: () => (
        <div className="mt-3.5 space-y-2">
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 leading-none">
            <span>vs 44% industry</span>
            <span className="text-emerald-400 font-semibold bg-emerald-400/10 px-1.5 py-0.5 rounded-full scale-95 origin-right">
              +48%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
            <div className="h-full w-[92%] bg-[#E8854A] rounded-full shadow-[0_0_8px_rgba(232,133,74,0.4)]" />
          </div>
        </div>
      ),
    },
    {
      label: "Forms shipped",
      value: 1200,
      suffix: "+",
      renderGraphic: () => (
        <div className="mt-3.5 flex justify-between items-center bg-white/[0.01] border border-white/[0.04] px-2.5 py-1.5 rounded-xl h-8">
          <span className="font-mono text-[8px] text-zinc-500 flex items-center gap-1 leading-none">
            <span className="size-1 bg-emerald-500 rounded-full animate-pulse" />
            active nodes
          </span>
          <TrendingUp className="size-3.5 text-[#E8854A] animate-pulse" />
        </div>
      ),
    },
  ];

  return (
    <section className="px-4 py-16">
      <ScrollReveal>
        <div ref={ref} className="mx-auto max-w-4xl">
          {/* 4-Card Statistics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <MockStatCard key={stat.label} stat={stat} index={index} hasRun={inView} />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

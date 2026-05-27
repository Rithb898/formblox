"use client";

import { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  ArrowUpRight,
  CreditCard,
  BarChart3,
  FileText,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "~/components/ui/button";

const spring = { type: "spring" as const, stiffness: 100, damping: 22 };

const plans = [
  {
    id: "free",
    name: "Free",
    badge: null,
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explore AI-native forms with no commitment.",
    cta: "Current plan",
    ctaDisabled: true,
    highlight: false,
    features: [
      "3 forms",
      "50 responses / month",
      "AI follow-ups (5 per response)",
      "All question types",
      "Public form links",
      "Basic response dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most popular",
    monthlyPrice: 9,
    annualPrice: 7,
    description: "Everything you need to capture deeper answers at scale.",
    cta: "Upgrade to Pro",
    ctaDisabled: false,
    highlight: true,
    features: [
      "Unlimited forms",
      "1,000 responses / month",
      "Unlimited AI follow-ups",
      "AI response summaries",
      "AI form generation",
      "Conditional logic & branching",
      "Custom themes & branding",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    badge: null,
    monthlyPrice: 19,
    annualPrice: 15,
    description: "For teams that need collaboration, analytics, and integrations.",
    cta: "Upgrade to Team",
    ctaDisabled: false,
    highlight: false,
    features: [
      "Everything in Pro",
      "5,000 responses / month",
      "Team workspaces (up to 5 members)",
      "Analytics dashboard",
      "Drop-off funnel & per-question stats",
      "Webhooks + Slack / Discord",
      "CSV & JSON export",
      "Dedicated onboarding",
    ],
  },
];

const usageStats = [
  { label: "Forms Created", value: 3, max: 5, unit: "forms", icon: FileText },
  { label: "Monthly Submissions", value: 55, max: 1000, unit: "responses", icon: BarChart3 },
  { label: "AI Summary Credits", value: 8, max: 10, unit: "runs", icon: Bot },
];

function PlanCard({
  plan,
  annual,
  index,
  isCurrent,
}: {
  plan: (typeof plans)[number];
  annual: boolean;
  index: number;
  isCurrent: boolean;
}) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const annualSaving =
    plan.monthlyPrice > 0
      ? Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100)
      : 0;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.07 * index }}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col rounded-[1.5rem] p-[1px] transition-all duration-500 ${
        plan.highlight
          ? "bg-linear-to-b from-[#E8854A]/30 to-[#E8854A]/8 ring-1 ring-[#E8854A]/30 hover:ring-[#E8854A]/50"
          : isCurrent
            ? "ring-1 ring-white/10 bg-white/3"
            : "ring-1 ring-white/6 bg-white/2 hover:ring-white/12"
      }`}
    >
      {/* Spotlight glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.5rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(180px circle at var(--mx) var(--my), rgba(232,133,74,0.09), transparent 50%)",
        }}
      />

      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full bg-[#E8854A] px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#0a0a0a] shadow-lg shadow-[#E8854A]/25">
            <Sparkles className="size-2.5" />
            {plan.badge}
          </span>
        </div>
      )}

      {isCurrent && !plan.highlight && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#9B9B9B]">
            Current plan
          </span>
        </div>
      )}

      <div
        className={`relative flex flex-1 flex-col rounded-[calc(1.5rem-1px)] px-6 py-7 ${
          plan.highlight
            ? "bg-[#0f0e0d] border border-[#E8854A]/10"
            : "bg-[#0d0d0d] border border-white/[0.03]"
        }`}
      >
        {/* Plan name */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
            {plan.name}
          </span>
          {plan.highlight && <Zap className="size-3.5 text-[#E8854A]" />}
          {isCurrent && !plan.highlight && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-[#4A4A4A]">
              Active
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 flex h-10 items-end gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan.id}-${annual}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] leading-none"
            >
              {price === 0 ? "Free" : `$${price}`}
            </motion.span>
          </AnimatePresence>
          {price > 0 && <span className="mb-0.5 text-xs text-[#6B6B6B]">/ mo</span>}
          {annual && annualSaving > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-0.5 ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20"
            >
              -{annualSaving}%
            </motion.span>
          )}
        </div>

        <div className="mt-1 h-4">
          {annual && plan.monthlyPrice > 0 && (
            <p className="font-mono text-[10px] text-[#6B6B6B]">
              Billed annually · ${plan.annualPrice * 12}/yr
            </p>
          )}
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-[#6B6B6B]">{plan.description}</p>

        {/* CTA */}
        <div className="mt-5">
          {isCurrent ? (
            <div className="flex h-9 w-full items-center justify-center rounded-xl border border-white/8 text-xs font-medium text-[#4A4A4A]">
              Current plan
            </div>
          ) : plan.highlight ? (
            <button
              type="button"
              className="group/btn flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#E8854A] text-xs font-semibold text-[#0a0a0a] shadow-[0_0_20px_rgba(232,133,74,0.25)] transition-all duration-300 hover:bg-[#E8854A]/90 hover:shadow-[0_0_28px_rgba(232,133,74,0.35)]"
            >
              {plan.cta}
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
          ) : (
            <button
              type="button"
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-medium text-[#9B9B9B] transition-all duration-200 hover:border-white/20 hover:text-[#F2F2F2]"
            >
              {plan.cta}
              <ArrowUpRight className="size-3.5" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-white/[0.04]" />

        {/* Features */}
        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[12px] text-[#8E8E93]">
              <span
                className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full ${
                  plan.highlight
                    ? "bg-[#E8854A]/15 text-[#E8854A]"
                    : "bg-white/[0.04] text-zinc-500"
                }`}
              >
                <Check className="size-2" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function BillingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-full bg-[#080808] text-[#F2F2F2]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed left-1/2 top-0 -z-0 h-96 w-[600px] -translate-x-1/2 rounded-full bg-[#E8854A]/4 blur-[140px]" />

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="size-4 text-[#E8854A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              Plan & Billing
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F2F2F2]">
            Your subscription
          </h1>
          <p className="mt-1.5 text-sm text-[#6B6B6B]">
            Manage your plan and track usage across your workspace.
          </p>
        </motion.div>

        {/* Current plan + usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.06 }}
          className="mb-10 rounded-2xl border border-white/6 bg-white/[0.02] p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
                Active plan
              </span>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Free Beta</h2>
              <p className="mt-0.5 text-xs text-[#6B6B6B]">
                All premium features unlocked during public beta.
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-[#E8854A]/25 bg-[#E8854A]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#E8854A]">
              Beta
            </div>
          </div>

          {/* Usage bars */}
          <div className="grid gap-4 sm:grid-cols-3">
            {usageStats.map(({ label, value, max, unit, icon: Icon }, i) => {
              const pct = Math.min((value / max) * 100, 100);
              const isHigh = pct >= 80;
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-3 text-[#4A4A4A]" />
                      <span className="text-[11px] text-[#6B6B6B]">{label}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-semibold ${isHigh ? "text-amber-400" : "text-[#F2F2F2]"}`}
                    >
                      {value.toLocaleString()} / {max.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        delay: 0.2 + i * 0.05,
                        duration: 0.6,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                      className={`h-full rounded-full ${isHigh ? "bg-amber-400" : "bg-[#E8854A]"}`}
                    />
                  </div>
                  <p className="mt-1.5 font-mono text-[9px] text-[#3A3A3A]">{unit}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Plan picker header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-7 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Upgrade your plan</h2>
            <p className="mt-0.5 text-xs text-[#6B6B6B]">
              Start free. Upgrade when your forms start doing serious work.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/6 bg-white/[0.02] p-1 pr-3">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 ${
                !annual
                  ? "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20"
                  : "text-[#6B6B6B] hover:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 ${
                annual
                  ? "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20"
                  : "text-[#6B6B6B] hover:text-zinc-300"
              }`}
            >
              Annually
            </button>
            <AnimatePresence>
              {annual && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.18 }}
                  className="font-mono text-[9px] font-semibold text-emerald-400"
                >
                  Save 22%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              index={i}
              isCurrent={plan.id === "free"}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center font-mono text-[10px] text-[#3A3A3A]"
        >
          No credit card required · Cancel anytime · Free during beta
        </motion.p>
      </div>
    </div>
  );
}

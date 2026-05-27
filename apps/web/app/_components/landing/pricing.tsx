"use client";

import { useState } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollReveal } from "./scroll-reveal";
import { LandingButton } from "./landing-button";

const spring = { type: "spring" as const, stiffness: 100, damping: 22 };

const plans = [
  {
    id: "free",
    name: "Free",
    badge: null,
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explore AI-native forms with no commitment.",
    cta: "Get started free",
    ctaHref: "/signup",
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
    cta: "Start Pro",
    ctaHref: "/signup?plan=pro",
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
    cta: "Start Team",
    ctaHref: "/signup?plan=team",
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

function PlanCard({
  plan,
  annual,
  index,
}: {
  plan: (typeof plans)[number];
  annual: boolean;
  index: number;
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...spring, delay: 0.08 * index }}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col rounded-[1.75rem] p-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        plan.highlight
          ? "bg-linear-to-b from-[#E8854A]/20 to-[#E8854A]/5 ring-1 ring-[#E8854A]/30 hover:ring-[#E8854A]/50"
          : "bg-white/2 ring-1 ring-white/6 hover:ring-white/12"
      }`}
    >
      {/* Spotlight glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(200px circle at var(--mx) var(--my), rgba(232,133,74,0.10), transparent 50%)",
        }}
      />

      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="flex items-center gap-1 rounded-full bg-[#E8854A] px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#0a0a0a] shadow-lg shadow-[#E8854A]/25">
            <Sparkles className="size-2.5" />
            {plan.badge}
          </span>
        </div>
      )}

      {/* Card body — flex-1 so all cards in a row stretch to the same height */}
      <div
        className={`relative flex flex-1 flex-col rounded-[1.4rem] border px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${
          plan.highlight ? "bg-[#0f0e0d] border-[#E8854A]/10" : "bg-[#111] border-white/[0.02]"
        }`}
      >
        {/* Plan name */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
            {plan.name}
          </span>
          {plan.highlight && <Zap className="size-3.5 text-[#E8854A]" />}
        </div>

        {/* Price — fixed height so all cards align below this point */}
        <div className="mt-4 h-11 flex items-end gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan.id}-${annual}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="text-4xl font-semibold tracking-tighter text-[#F2F2F2] leading-none"
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

        {/* Billing note — fixed height so description always starts at the same y */}
        <div className="mt-1 h-4">
          {annual && plan.monthlyPrice > 0 && (
            <p className="font-mono text-[10px] text-[#6B6B6B]">
              Billed annually · ${plan.annualPrice * 12}/yr
            </p>
          )}
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-[#6B6B6B]">{plan.description}</p>

        {/* CTA */}
        <div className="mt-6">
          <LandingButton
            href={plan.ctaHref}
            variant={plan.highlight ? "primary" : "secondary"}
            fullWidth
          >
            {plan.cta}
          </LandingButton>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-white/[0.04]" />

        {/* Features */}
        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[13px] text-[#8E8E93]">
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                  plan.highlight
                    ? "bg-[#E8854A]/12 text-[#E8854A]"
                    : "bg-white/[0.04] text-zinc-500"
                }`}
              >
                <Check className="size-2.5" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative px-4 py-24">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8854A]/6 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-[#174c4c]/8 blur-[100px]" />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              Simple, honest pricing.
            </h2>
            <p className="mt-3 text-sm text-[#6B6B6B] max-w-sm mx-auto">
              Start free. Upgrade when your forms start doing serious work.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] p-1 pr-3">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest transition-all duration-300 ${
                  !annual
                    ? "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20"
                    : "text-[#6B6B6B] hover:text-zinc-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest transition-all duration-300 ${
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
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-[9px] font-semibold text-emerald-400"
                  >
                    Save up to 22%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>

        {/* Cards grid — items-stretch ensures equal heights across all three */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} index={i} />
          ))}
        </div>

        {/* Footer note */}
        <ScrollReveal delay={0.3}>
          <p className="mt-10 text-center font-mono text-[10px] text-[#6B6B6B]">
            No credit card required · Cancel anytime · Free during beta
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

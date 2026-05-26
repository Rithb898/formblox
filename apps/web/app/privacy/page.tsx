"use client";

import React from "react";
import { ScrollReveal } from "../_components/landing/scroll-reveal";
import { LandingNav } from "../_components/landing/landing-nav";
import { LandingFooter } from "../_components/landing/landing-footer";
import { ShieldCheck, Eye, Sparkles } from "lucide-react";

export default function PrivacyPage() {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We collect minimal account information required to provide secure workspace authentication, including your email address and securely hashed login passwords. When configuring forms, we collect and store the structure of your forms (questions, configurations, validation limits) and all respondent submissions routed to your dashboard.",
    },
    {
      title: "2. How We Use Your Data",
      content:
        "Your data is used strictly to run the conversational runner, construct the 3-Pane Editor preview workspace, deliver real-time response analytics, and power active AI follow-up processors. We do not use your respondent answers or private form configurations to train public large language models.",
    },
    {
      title: "3. Data Security & Encryption",
      content:
        "Data integrity is our utmost priority. All web traffic is routed over secure SSL/TLS channels. Internally, all data communications utilize type-safe, authenticated tRPC routes. Secure database hashing layers protect your passwords, and database access controls isolate workspace partitions cleanly.",
    },
    {
      title: "4. AI Processing Disclosures",
      content:
        "FormBlox utilizes secure API endpoints to process AI follow-ups (Slice 5) and AI form generation (Slice 7). Prompt descriptions are sent securely to Claude's analytical models to determine the optimal question sequence. These inputs are not retained or utilized by third parties for model training purposes.",
    },
    {
      title: "5. Integrations & Webhooks",
      content:
        "FormBlox offers support for third-party integrations (Slice 11+). When you configure outbound webhooks, Slack alerts, or Discord channels, form responses are transmitted directly to the configured endpoint. FormBlox has no control over how these third-party platforms handle your data.",
    },
    {
      title: "6. Your Data Rights & Deletion",
      content:
        "You retain complete control over your workspace. You can edit configurations, clear submissions, or delete your entire form version history from the dashboard at any time. Form deletions instantly and permanently purge all associated respondent tables from our servers.",
    },
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#080808] text-[#F2F2F2] flex flex-col justify-between">
      {/* Background Lighting Flares */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-18rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#E8854A] opacity-[0.08] blur-[160px]" />
        <div className="absolute bottom-[-22rem] left-[8vw] h-[36rem] w-[36rem] rounded-full bg-[#174c4c] opacity-[0.08] blur-[170px]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <LandingNav />

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-32 sm:pt-36 flex-grow">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full border border-[#E8854A]/25 bg-[#E8854A]/5 px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#E8854A]">
              <ShieldCheck className="size-3 text-[#E8854A]" />
              <span>User Protection</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-xs font-mono text-[#6B6B6B]">
              Last updated: May 27, 2026
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div
            onMouseMove={handleMouseMove}
            className="group relative rounded-[2rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.1]"
          >
            {/* Spotlight border overlay — radial gradient follows cursor */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(350px circle at var(--mx) var(--my), rgba(232,133,74,0.1), transparent 45%)",
              }}
            />

            {/* Inner Content Core */}
            <div className="relative rounded-[calc(2rem-6px)] bg-[#111] p-6 sm:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02] text-left">
              {/* Introduction */}
              <div className="mb-8 border-b border-white/[0.06] pb-6">
                <p className="text-sm leading-relaxed text-[#B0B0B0]">
                  At FormBlox, we believe privacy is a fundamental right. This document details our absolute commitment to user data security, explaining exactly what information we collect, how it is routed, and the comprehensive control schemas you maintain over your workspace.
                </p>
              </div>

              {/* Sections list */}
              <div className="space-y-8">
                {sections.map((sec) => (
                  <div key={sec.title} className="space-y-2.5">
                    <h2 className="text-base font-semibold tracking-tight text-[#F2F2F2]">
                      {sec.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#8E8E93]">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Data Compliance capsule */}
              <div className="mt-10 rounded-xl border border-dashed border-[#E8854A]/25 bg-[#E8854A]/4 p-4 flex gap-3 items-start">
                <Eye className="size-4.5 text-[#E8854A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#E8854A] uppercase tracking-wider font-mono">Zero Public Training Policy</p>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    FormBlox respects content ownership. Under no circumstances do we lease, sell, or utilize private form response telemetry to train public generative model networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <LandingFooter />
    </main>
  );
}

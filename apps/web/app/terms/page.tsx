"use client";

import React from "react";
import { ScrollReveal } from "../_components/landing/scroll-reveal";
import { LandingNav } from "../_components/landing/landing-nav";
import { LandingFooter } from "../_components/landing/landing-footer";
import { FileText, ShieldAlert, Sparkles } from "lucide-react";

export default function TermsPage() {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing or using the FormBlox workspace, public runner endpoints, and AI generative modules, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the platform.",
    },
    {
      title: "2. Description of Service",
      content:
        "FormBlox provides an AI-native conversational form workspace including our 3-Pane Visual Editor, Typeform-style runner interfaces, AI Auto-Follow Up processors, and response analytics dashboard visualization engines. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.",
    },
    {
      title: "3. Account Security & Auth",
      content:
        "You are responsible for keeping your account credentials secure. You must immediately notify FormBlox of any unauthorized use of your account. FormBlox cannot and will not be liable for any loss or damage arising from your failure to secure your account credentials.",
    },
    {
      title: "4. Data Ownership & Content",
      content:
        "You retain full ownership of all form schemas, descriptive configurations, and respondent submission values collected through FormBlox. FormBlox acts solely as a data processor. You are solely responsible for compliance with global privacy regulations (GDPR, CCPA) regarding the collection of personal information.",
    },
    {
      title: "5. Intellectual Property",
      content:
        "All visual canvas layouts, Zustand state managers, custom CSS tokens, proprietary AI routing logic, and system codebase parameters are the sole intellectual property of FormBlox. You may not reverse-engineer, copy, or redistribute any aspect of the platform's core code or proprietary visual systems.",
    },
    {
      title: "6. Limitation of Liability",
      content:
        "FormBlox is provided on an 'as-is' and 'as-available' basis without warranties of any kind. Under no circumstances shall FormBlox be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform.",
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
              <FileText className="size-3 text-[#E8854A]" />
              <span>Legal Guidelines</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-xs font-mono text-[#6B6B6B]">Last updated: May 27, 2026</p>
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
                  Welcome to FormBlox. Please read these Terms of Service carefully before utilizing
                  our workspace platforms. By logging into your account or running active schemas,
                  you acknowledge that you have read, understood, and agreed to be governed by these
                  conditions.
                </p>
              </div>

              {/* Sections list */}
              <div className="space-y-8">
                {sections.map((sec) => (
                  <div key={sec.title} className="space-y-2.5">
                    <h2 className="text-base font-semibold tracking-tight text-[#F2F2F2]">
                      {sec.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#8E8E93]">{sec.content}</p>
                  </div>
                ))}
              </div>

              {/* Legal Warning Notice */}
              <div className="mt-10 rounded-xl border border-dashed border-[#E8854A]/25 bg-[#E8854A]/4 p-4 flex gap-3 items-start">
                <ShieldAlert className="size-4.5 text-[#E8854A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#E8854A] uppercase tracking-wider font-mono">
                    Acceptable Use Policy
                  </p>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    Accounts found constructing malicious schemas, executing phishing surveys, or
                    deliberately generating harmful content violating global directives will be
                    terminated immediately.
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

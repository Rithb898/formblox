"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessagesSquare, ChevronDown, Check, Globe, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "~/components/ui/badge";
import { LandingButton } from "./landing-button";

const spring = { type: "spring" as const, stiffness: 100, damping: 22 };

export function Hero() {
  const [formType, setFormType] = useState<"SaaS" | "E-commerce" | "survey">("SaaS");
  const [feelType, setFeelType] = useState<"a chat" | "a quiz" | "an interview">("a chat");
  const [activeDropdown, setActiveDropdown] = useState<"form" | "feel" | null>(null);

  const formOptions = ["SaaS", "E-commerce", "survey"] as const;
  const feelOptions = ["a chat", "a quiz", "an interview"] as const;

  // Auto-scrolling horizontal text banner for the last text segment
  const captureOptions = [
    "lead emails",
    "user feedback",
    "bug reports",
    "onboarding data",
    "customer reviews",
  ] as const;
  const [captureIndex, setCaptureIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptureIndex((prev) => (prev + 1) % captureOptions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const captureInput = captureOptions[captureIndex]!;

  return (
    <motion.section
      id="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="px-4 pt-32 pb-24 sm:pt-36"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <Badge className="h-7 rounded-full border-[#E8854A]/20 bg-[#E8854A]/10 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8854A]">
            <MessagesSquare className="size-3" />
            AI-native forms
          </Badge>
        </motion.div>

        {/* Dynamic Sentence Builder Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          className="mt-10 max-w-5xl text-3xl font-semibold leading-[1.6] tracking-tight text-[#F2F2F2] sm:text-5xl md:text-6xl select-none"
        >
          I want to build a {/* Form Type Dropdown Trigger */}
          <span className="relative inline-block mx-1.5">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "form" ? null : "form")}
              className="inline-flex items-center gap-2 border-b-[3px] border-[#E8854A] pb-1 text-[#E8854A] hover:bg-[#E8854A]/5 px-3 py-0.5 rounded-xl transition-colors cursor-pointer outline-none tracking-normal font-semibold"
            >
              {formType}
              <ChevronDown className="size-4 md:size-6 text-[#E8854A]/80 shrink-0" />
            </button>

            <AnimatePresence>
              {activeDropdown === "form" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 mt-3.5 z-30 w-44 rounded-2xl border border-white/[0.08] bg-[#0c0c0c]/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-[#E8854A]/30 flex flex-col gap-1"
                >
                  {formOptions.map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setFormType(o);
                        setActiveDropdown(null);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all flex items-center justify-between tracking-wide leading-normal ${
                        formType === o
                          ? "bg-[#E8854A]/12 text-[#E8854A]"
                          : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span>{o} Form</span>
                      {formType === o && <Check className="size-3.5 text-[#E8854A]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </span>{" "}
          questionnaire that feels like {/* Feel Type Dropdown Trigger */}
          <span className="relative inline-block mx-1.5">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "feel" ? null : "feel")}
              className="inline-flex items-center gap-2 border-b-[3px] border-[#E8854A] pb-1 text-[#E8854A] hover:bg-[#E8854A]/5 px-3 py-0.5 rounded-xl transition-colors cursor-pointer outline-none tracking-normal font-semibold"
            >
              {feelType}
              <ChevronDown className="size-4 md:size-6 text-[#E8854A]/80 shrink-0" />
            </button>

            <AnimatePresence>
              {activeDropdown === "feel" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 mt-3.5 z-30 w-44 rounded-2xl border border-white/[0.08] bg-[#0c0c0c]/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-[#E8854A]/30 flex flex-col gap-1"
                >
                  {feelOptions.map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setFeelType(o);
                        setActiveDropdown(null);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all flex items-center justify-between tracking-wide leading-normal ${
                        feelType === o
                          ? "bg-[#E8854A]/12 text-[#E8854A]"
                          : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span>{o}</span>
                      {feelType === o && <Check className="size-3.5 text-[#E8854A]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </span>{" "}
          to capture {/* Auto-moving animated text segment (banner style) */}
          <span className="inline-block relative overflow-hidden h-[1.25em] align-middle px-3 border-b-[3px] border-dashed border-[#6B6B6B] min-w-[200px] sm:min-w-[260px] md:min-w-[290px] text-[#F2F2F2] font-semibold tracking-tight mx-1.5 pb-1 select-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={captureInput}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", stiffness: 140, damping: 15 }}
                className="absolute inset-0 text-center font-semibold text-[#F2F2F2] tracking-normal select-none"
              >
                {captureInput}
              </motion.span>
            </AnimatePresence>
          </span>
          .
        </motion.div>

        {/* Animated Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-[#6B6B6B] sm:text-lg"
        >
          FormBlox automatically morphs custom input configurations into luxury micro-animations
          tailored to your exact brand feel.
        </motion.p>

        {/* Animated CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <LandingButton href="/signup" size="lg">
            Create this form
          </LandingButton>
        </motion.div>

        {/* Helper Mock Form Card Component & Infographics */}
        {(() => {
          type MockForm = {
            title: string;
            status: "published" | "draft";
            span: string;
            renderGraphic: () => React.ReactNode;
          };

          const mockForms: MockForm[] = [
            {
              title: "SaaS Onboarding Flow",
              status: "published",
              span: "md:col-span-5",
              renderGraphic: () => (
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>Active submissions</span>
                    <span className="text-[#E8854A] font-semibold flex items-center gap-1">
                      <span className="size-1 bg-[#E8854A] rounded-full animate-ping" />
                      +42% Growth
                    </span>
                  </div>
                  {/* Premium visual SVG sparkline chart */}
                  <svg
                    className="w-full h-14 text-[#E8854A] overflow-visible mt-2"
                    viewBox="0 0 100 30"
                  >
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E8854A" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#E8854A" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,25 Q15,4 32,20 T62,10 T88,2 T100,5"
                      fill="none"
                      stroke="#E8854A"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,25 Q15,4 32,20 T62,10 T88,2 T100,5 L100,30 L0,30 Z"
                      fill="url(#chartGrad)"
                    />
                    <circle cx="88" cy="2" r="2.5" fill="#E8854A" className="animate-pulse" />
                    <circle cx="88" cy="2" r="1.5" fill="#E8854A" />
                  </svg>
                </div>
              ),
            },
            {
              title: "Customer NPS Survey",
              status: "published",
              span: "md:col-span-7",
              renderGraphic: () => (
                <div className="mt-3 flex items-center justify-between gap-5">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Completion rate</span>
                      <span className="text-emerald-400 font-semibold">+18.4%</span>
                    </div>
                    <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
                      <div className="h-full w-[94%] bg-[#E8854A] rounded-full" />
                    </div>
                    <p className="text-[9px] text-zinc-500 font-mono">Completion vs drop-offs</p>
                  </div>
                  {/* Radial progress ring */}
                  <div className="relative size-12 shrink-0">
                    <svg className="size-full -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        className="stroke-white/[0.04] fill-none"
                        strokeWidth="3"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        className="stroke-[#E8854A] fill-none"
                        strokeWidth="3"
                        strokeDasharray="125"
                        strokeDashoffset="12"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-semibold text-white">
                      94%
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: "Bug Report Intake",
              status: "draft",
              span: "md:col-span-7",
              renderGraphic: () => (
                <div className="mt-4 space-y-2.5 text-[10px]">
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5 text-zinc-500 font-mono">
                    <span>Telemetric fields</span>
                    <span className="text-zinc-400">Chrome SSR / Console Logs</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.04] pb-1.5 text-zinc-500 font-mono">
                    <span>Validation rules</span>
                    <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                      Strict
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500 font-mono">
                    <span>Submissions</span>
                    <span className="text-zinc-400">Draft Status</span>
                  </div>
                </div>
              ),
            },
            {
              title: "Product Feedback Quiz",
              status: "published",
              span: "md:col-span-5",
              renderGraphic: () => (
                <div className="mt-4 flex items-center justify-between gap-3">
                  {/* Glassmorphic user avatars overlapping stack */}
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {["A", "M", "E", "S"].map((init, idx) => (
                      <div
                        key={idx}
                        className="flex size-7 items-center justify-center rounded-full bg-[#E8854A]/20 text-[#E8854A] font-mono text-[9px] font-semibold border-[2px] border-[#111]"
                      >
                        {init}
                      </div>
                    ))}
                    <div className="flex size-7 items-center justify-center rounded-full bg-white/[0.03] text-zinc-400 font-mono text-[8px] font-semibold border-[2px] border-[#111] leading-none">
                      +28
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-1">
                      Total submissions
                    </p>
                    <p className="text-sm font-semibold text-white">482 responses</p>
                  </div>
                </div>
              ),
            },
          ];

          function MockFormCard({ form, index }: { form: MockForm; index: number }) {
            function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
            }

            const published = form.status === "published";

            return (
              <div
                onMouseMove={handleMouseMove}
                className={`${form.span} group relative cursor-default rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12] col-span-1`}
              >
                {/* Spotlight border overlay — radial gradient follows cursor */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(220px circle at var(--mx) var(--my), rgba(232,133,74,0.12), transparent 45%)",
                  }}
                />

                {/* Inner core */}
                <div className="relative flex h-full min-h-[9rem] flex-col justify-between overflow-hidden rounded-[1.4rem] bg-[#111] p-5 border border-white/[0.02]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-3">
                    <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white tracking-tight">
                      {form.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] ${
                        published
                          ? "bg-[#E8854A]/12 text-[#E8854A]"
                          : "bg-white/[0.06] text-[#6B6B6B]"
                      }`}
                    >
                      {published ? (
                        <Globe className="size-2 text-[#E8854A]" />
                      ) : (
                        <FileText className="size-2" />
                      )}
                      {form.status}
                    </span>
                  </div>

                  {/* Render Visual Infographics */}
                  {form.renderGraphic()}
                </div>
              </div>
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              className="mt-16 w-full max-w-5xl rounded-3xl bg-white/[0.01] p-2 ring-1 ring-white/[0.06] relative shadow-2xl overflow-hidden"
            >
              {/* Dynamic background lighting flares */}
              <div className="pointer-events-none absolute -left-1/4 -top-1/4 -z-10 h-96 w-96 rounded-full bg-[#E8854A]/8 blur-[100px] animate-pulse" />
              <div className="pointer-events-none absolute -right-1/4 -bottom-1/4 -z-10 h-96 w-96 rounded-full bg-orange-500/5 blur-[100px]" />

              {/* Dashboard Container Layout (Sidebar Removed) */}
              <div className="rounded-[1.4rem] bg-[#090909] border border-white/[0.04] overflow-hidden text-left flex flex-col min-h-[460px]">
                {/* Elegant macOS-style Window Header */}
                <div className="flex items-center justify-between border-b border-white/[0.05] bg-[#0c0c0c]/85 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <span className="size-2 rounded-full bg-red-500/20 border border-red-500/30" />
                      <span className="size-2 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                      <span className="size-2 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                    <span className="h-4 w-px bg-white/[0.08] mx-1" />
                    <span className="font-mono text-[10px] tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Globe className="size-3 text-[#E8854A] animate-pulse" />
                      visual-forms-dashboard
                    </span>
                  </div>

                  {/* Mock Dashboard Tabs */}
                  <div className="flex gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.04]">
                    {["All Forms", "Active", "Archived"].map((tab, idx) => (
                      <span
                        key={idx}
                        className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1 rounded-lg ${
                          idx === 0
                            ? "bg-[#E8854A]/12 text-[#E8854A] font-semibold border border-[#E8854A]/20"
                            : "text-zinc-500"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Showcase Bento Area */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Inner Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Visual Response Workspace
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Interactive bento showcase of active form states
                      </p>
                    </div>
                    <span className="font-mono text-[8px] bg-white/[0.03] text-emerald-400 ring-1 ring-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sync Normal
                    </span>
                  </div>

                  {/* Bento Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {mockForms.map((form, index) => (
                      <MockFormCard key={form.title} form={form} index={index} />
                    ))}
                  </div>

                  {/* Footer System info */}
                  <div className="border-t border-white/[0.04] pt-4 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span>Performance: 98% Score</span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Mock Syncing Online
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>
    </motion.section>
  );
}

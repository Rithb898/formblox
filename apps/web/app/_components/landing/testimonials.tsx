"use client";

import { ScrollReveal } from "./scroll-reveal";
import { Star, CheckCircle2 } from "lucide-react";
import React from "react";

const testimonials = [
  {
    quote:
      "FormBlox replaced three Typeform flows with one chat-like form. Our completion rate nearly doubled.",
    name: "Elena Vasquez",
    role: "Head of Growth, Luminate",
    stars: 5,
  },
  {
    quote:
      "The AI follow-ups catch details we used to chase in email threads. It feels like the form is interviewing you.",
    name: "Marcus Chen",
    role: "Product Lead, Cortex AI",
    stars: 5,
  },
  {
    quote:
      "We linked to it from our onboarding page and saw 40% more qualified leads in the first week.",
    name: "Priya Nair",
    role: "Founder, Bloom Commerce",
    stars: 5,
  },
];

function TestimonialCard({ testimonial }: { testimonial: (typeof testimonials)[number] }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative cursor-default rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/[0.12] h-full"
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
      <div className="relative flex h-full flex-col justify-between rounded-[1.4rem] bg-[#111] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.02]">
        <div>
          {/* Quote bubble & Star ratings */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-0.5">
              {[...Array(testimonial.stars)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-[#E8854A] text-[#E8854A]" />
              ))}
            </div>
            {/* Quote indicator */}
            <svg
              className="size-5 text-[#E8854A]/20 transition-colors duration-300 group-hover:text-[#E8854A]/40"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          <p className="text-[14.5px] leading-relaxed text-[#B0B0B0] font-normal italic">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20">
              <span className="font-mono text-[11px] font-semibold">
                {testimonial.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-[#F2F2F2]">{testimonial.name}</p>
                <CheckCircle2 className="size-3 text-emerald-500 fill-emerald-500/10" />
              </div>
              <p className="font-mono text-[10px] text-[#6B6B6B]">{testimonial.role}</p>
            </div>
          </div>
          <span className="font-mono text-[9px] text-[#E8854A] bg-[#E8854A]/8 px-2 py-0.5 rounded-full border border-[#E8854A]/15 font-medium">
            Verified
          </span>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="px-4 py-20 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute left-1/4 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-[#E8854A]/3 opacity-[0.4] blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-[#F2F2F2] sm:text-4xl">
              Loved by growth & product teams.
            </h2>
            <p className="mt-3 text-sm text-[#6B6B6B] max-w-md mx-auto">
              See how teams are unlocking massive response conversions and deep insights.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 0.15} className="h-full">
              <TestimonialCard testimonial={t} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

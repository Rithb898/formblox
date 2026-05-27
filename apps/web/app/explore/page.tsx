"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Inbox, Layers, Loader2 } from "lucide-react";
import { trpc } from "~/trpc/client";
import { cn } from "~/lib/utils";

const ACCENT = "#E8854A";
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-4",
];

type ExploreForm = {
  id: string;
  publicSlug: string;
  title: string;
  description: string | null;
  responseCount: number;
  fieldCount: number;
  publishedAt: Date | string | null;
};

function ExploreCard({ form, index }: { form: ExploreForm; index: number }) {
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        SPANS[index % SPANS.length],
        "animate-fade-up col-span-1",
        "group relative rounded-[1.75rem] bg-white/2 p-1.5 ring-1 ring-white/6",
        `transition-all duration-500 ${EASE}`,
        "hover:ring-white/12",
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ${EASE} group-hover:opacity-100`}
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(232,133,74,0.18), transparent 45%)",
        }}
      />

      {/* Inner core */}
      <div className="relative flex h-full min-h-40 flex-col gap-3 overflow-hidden rounded-[1.4rem] bg-[#111] p-5">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-white">
          {form.title}
        </h3>

        {/* Description */}
        {form.description && (
          <p className="line-clamp-2 text-xs text-[#6B6B6B] leading-relaxed">{form.description}</p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5A5A5A]">
              <Inbox className="size-3" />
              {form.responseCount} {form.responseCount === 1 ? "response" : "responses"}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5A5A5A]">
              <Layers className="size-3" />
              {form.fieldCount} {form.fieldCount === 1 ? "field" : "fields"}
            </span>
          </div>

          {form.publishedAt && (
            <span className="font-mono text-[10px] text-[#4A4A4A]">
              {formatDistanceToNow(new Date(form.publishedAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* CTA — slides up on hover */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-4",
            "bg-linear-to-t from-[#111] via-[#111]/90 to-transparent pt-10",
            "translate-y-2 opacity-0",
            `transition-all duration-500 ${EASE}`,
            "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
            "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          )}
        >
          <Link
            href={`/f/${form.publicSlug}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium",
              "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
              `transition-all duration-300 ${EASE}`,
              "hover:bg-[#E8854A]/20 hover:ring-[#E8854A]/40",
            )}
          >
            Fill out
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        SPANS[index % SPANS.length],
        "col-span-1 rounded-[1.75rem] bg-white/2 p-1.5 ring-1 ring-white/6",
      )}
    >
      <div className="min-h-40 animate-pulse overflow-hidden rounded-[1.4rem] bg-[#111]">
        <div
          className="size-full animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const formsQuery = trpc.forms.public.listPublic.useQuery(undefined);
  const forms = formsQuery.data ?? [];
  const isLoading = formsQuery.isPending;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F2F2F2]">
      {/* Minimal top nav */}
      <nav className="fixed inset-x-0 top-4 z-40 px-4">
        <div className="mx-auto max-w-4xl rounded-full bg-white/1 p-1 ring-1 ring-white/6">
          <div className="flex h-12 items-center justify-between rounded-full bg-[#111] px-4 border border-white/1">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="FormBlox"
                width={100}
                height={25}
                className="object-contain"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6B6B6B] transition-colors duration-300 hover:text-[#F2F2F2]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium",
                  "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
                  `transition-all duration-300 ${EASE}`,
                  "hover:bg-[#E8854A]/20",
                )}
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12 animate-fade-up">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8854A]/10 px-3 py-1 ring-1 ring-[#E8854A]/20">
            <span className="size-1.5 rounded-full bg-[#E8854A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#E8854A]">
              Public forms
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Explore Forms
          </h1>
          <p className="mt-3 text-sm text-[#6B6B6B] max-w-lg">
            Browse publicly shared forms. Fill one out — no account required.
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="select-none text-6xl font-semibold tracking-tighter text-white/4">
              No public forms yet
            </p>
            <p className="mt-4 text-sm text-[#6B6B6B]">
              Create an account and publish a public form to appear here.
            </p>
            <Link
              href="/signup"
              className={cn(
                "mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium",
                "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
                `transition-all duration-300 ${EASE}`,
                "hover:bg-[#E8854A]/20",
              )}
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {forms.map((form, i) => (
              <ExploreCard key={form.id} form={form} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

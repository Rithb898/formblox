"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

const navLinks = [
  { href: "#preview", label: "Overview" },
  { href: "#workflow", label: "Features" },
  { href: "#wedge", label: "AI Engine" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4">
      <div
        onMouseMove={handleMouseMove}
        className="group relative mx-auto max-w-4xl rounded-full bg-white/[0.01] p-1 ring-1 ring-white/[0.06] transition-all duration-500 hover:ring-white/[0.1]"
      >
        {/* Spotlight border overlay — radial gradient follows cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(120px circle at var(--mx) var(--my), rgba(232,133,74,0.08), transparent 45%)",
          }}
        />

        <nav className="relative flex h-12 items-center justify-between rounded-full bg-[#111] px-2 pl-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/[0.01]">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#F2F2F2]">
            <span className="size-2 rounded-full bg-[#E8854A] animate-pulse" />
            FormBlox
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6B6B6B] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 rounded-full text-xs text-[#6B6B6B] hover:bg-white/[0.06] hover:text-[#F2F2F2] px-3.5"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 rounded-full bg-[#E8854A] text-[11px] font-semibold text-[#0a0a0a] hover:bg-[#E8854A]/90 active:scale-[0.98] px-4"
            >
              <Link href="/signup">
                Start free
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="md:hidden flex items-center pr-1.5">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-[#F2F2F2] hover:bg-white/[0.06] size-8 animate-none"
                  aria-label="Open menu"
                >
                  <Menu className="size-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="border-white/[0.08] bg-[#080808] text-[#F2F2F2]"
                showCloseButton
              >
                <SheetHeader>
                  <SheetTitle className="text-[#F2F2F2]">FormBlox</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 px-4 mt-6">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <a href={link.href} className="rounded-xl px-3 py-2 text-sm text-[#6B6B6B] hover:bg-white/[0.04] hover:text-[#F2F2F2]">
                        {link.label}
                      </a>
                    </SheetClose>
                  ))}
                  <div className="mt-4 grid gap-2">
                    <Button variant="outline" asChild className="rounded-full border-white/[0.08] bg-white/[0.03] text-[#F2F2F2]">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="rounded-full bg-[#E8854A] text-[#0a0a0a] hover:bg-[#E8854A]/90">
                      <Link href="/signup">Start building</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}

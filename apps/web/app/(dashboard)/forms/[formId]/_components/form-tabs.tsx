"use client";

import Link from "next/link";
import { Inbox, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";

const EASE = "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

export function FormTabs({ formId, active }: { formId: string; active: "responses" | "summary" }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
      <Link
        href={`/forms/${formId}/responses`}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          EASE,
          active === "responses"
            ? "bg-white/[0.08] text-[#F2F2F2]"
            : "text-[#6B6B6B] hover:text-[#F2F2F2]",
        )}
      >
        <Inbox className="size-3" />
        Responses
      </Link>
      <Link
        href={`/forms/${formId}/summary`}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          EASE,
          active === "summary"
            ? "bg-[#7C3AED]/20 text-[#A78BFA]"
            : "text-[#6B6B6B] hover:text-[#A78BFA]",
        )}
      >
        <Sparkles className="size-3" />
        AI Summary
      </Link>
    </div>
  );
}

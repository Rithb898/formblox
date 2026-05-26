"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Check, Star } from "lucide-react";
import { cn } from "~/lib/utils";

const sequence = [
  { id: "q1", side: "form", text: "What's your name?" },
  { id: "a1", side: "user", text: "Rith" },
  { id: "q2", side: "form", text: "What are you building today?" },
  { id: "a2", side: "choice", text: "Customer onboarding" },
  { id: "ai1", side: "ai", text: "What should the first follow-up clarify?" },
  { id: "a3", side: "user", text: "Company size and urgency." },
  { id: "q3", side: "form", text: "How confident is the lead?" },
  { id: "rating", side: "rating", text: "4" },
  { id: "done", side: "done", text: "Thanks - we got it." },
] as const;

const spring = { type: "spring", stiffness: 160, damping: 24 } as const;

function Avatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8854A] font-mono text-[12px] font-semibold text-[#0a0a0a]">
      F
    </div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring}
      className="flex items-end gap-2.5"
    >
      <Avatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/[0.07] bg-[#141414] px-4 py-3.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-typing-bounce rounded-full bg-[#6B6B6B]"
            style={{ animationDelay: `${dot * 150}ms` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function DemoBubble({ item }: { item: (typeof sequence)[number] }) {
  const isForm = item.side === "form" || item.side === "ai" || item.side === "done";
  const isUser = item.side === "user" || item.side === "choice" || item.side === "rating";

  if (item.side === "rating") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 18, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
        transition={spring}
        className="flex justify-end"
      >
        <div className="flex gap-1.5 rounded-2xl rounded-br-sm bg-[#E8854A] px-3 py-2 text-[#0a0a0a]">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn("size-4", i < 4 && "fill-[#0a0a0a]")} />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: isUser ? 18 : -18,
        y: 8,
        filter: "blur(4px)",
      }}
      animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      transition={spring}
      className={cn("flex", isUser ? "justify-end" : "items-end gap-2.5")}
    >
      {isForm && <Avatar />}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-3 text-left text-[14px] leading-relaxed",
          item.side === "form" && "rounded-bl-sm border border-white/[0.07] bg-[#141414] text-[#F2F2F2]",
          item.side === "ai" && "rounded-bl-sm border-l-2 border-[#E8854A] bg-[#1a1a1a] text-[#F2F2F2]",
          item.side === "done" && "rounded-bl-sm border border-white/[0.07] bg-[#141414] text-[#F2F2F2]",
          isUser && "rounded-br-sm bg-[#E8854A] text-[#0a0a0a]",
        )}
      >
        {item.side === "ai" && (
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#E8854A]">
            AI
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          {item.side === "done" && <Check className="size-4 text-[#E8854A]" />}
          {item.text}
        </span>
      </div>
    </motion.div>
  );
}

export function ChatDemo() {
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTyping(true);
      window.setTimeout(() => {
        setVisible((current) => (current >= sequence.length ? 1 : current + 1));
        setTyping(false);
      }, 520);
    }, 1550);

    return () => window.clearInterval(interval);
  }, []);

  const progress = Math.min(100, Math.round((visible / sequence.length) * 100));
  const shown = sequence.slice(0, visible);

  return (
    <div className="rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/[0.06]">
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
        className="overflow-hidden rounded-[calc(2rem-6px)] bg-[#111] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
      >
        <div className="border-b border-white/[0.06] bg-[#080808]/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar />
              <span className="text-sm font-semibold tracking-tight text-[#F2F2F2]">
                Lead intake
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#6B6B6B]">
              {String(Math.min(visible, sequence.length)).padStart(2, "0")} / 09
            </span>
          </div>
          <div className="mt-3 h-[2px] rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full bg-[#E8854A]"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 28 }}
            />
          </div>
        </div>

        <div className="flex min-h-[31rem] flex-col justify-end gap-4 px-4 py-5 sm:px-5">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.slice(-6).map((item) => (
              <DemoBubble key={item.id} item={item} />
            ))}
            {typing && <TypingBubble key="typing" />}
          </AnimatePresence>
        </div>

        <div className="border-t border-white/[0.06] bg-[#080808]/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#141414] p-1.5 pl-4">
            <span className="min-w-0 flex-1 text-left text-sm text-[#6B6B6B]">
              Type your answer...
            </span>
            <button
              type="button"
              aria-label="Send demo answer"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8854A] text-[#0a0a0a]"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

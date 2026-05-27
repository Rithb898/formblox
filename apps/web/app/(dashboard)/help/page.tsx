"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Mail,
  ChevronDown,
  BookOpen,
  Zap,
  BarChart3,
  Globe,
  MessageSquare,
  ExternalLink,
  Search,
} from "lucide-react";

const faqs = [
  {
    category: "Publishing",
    icon: Globe,
    items: [
      {
        q: "How do I publish a form?",
        a: "In the form editor, click the Publish button in the topbar. Once published, your form is live and accessible via its public link. You can copy the link from the topbar at any time.",
      },
      {
        q: "What are unlisted forms?",
        a: "Unlisted forms are published but hidden from the Explore templates page. Only people with the direct link can view and submit them — useful for private surveys.",
      },
      {
        q: "Can I unpublish a form?",
        a: "Yes. From the form editor topbar, open the publish menu and set the form back to Draft. Existing responses are preserved; the public URL will return a 404 until you republish.",
      },
    ],
  },
  {
    category: "AI Features",
    icon: Zap,
    items: [
      {
        q: "How do AI follow-up questions work?",
        a: "When a respondent answers a question, our AI can generate a context-aware follow-up to dig deeper. You can enable or disable this per-field in the field settings panel.",
      },
      {
        q: "Can I use AI to analyze responses?",
        a: "Yes — inside any form's Responses panel, switch to the Summary tab. The AI streams a synthesis of all your responses, identifying themes and key insights automatically.",
      },
      {
        q: "How do I generate a form with AI?",
        a: "From the Forms page, click New Form and choose Generate with AI. Describe what you want to collect and the AI will scaffold a complete form with appropriate field types.",
      },
    ],
  },
  {
    category: "Responses",
    icon: BarChart3,
    items: [
      {
        q: "Where do I see my responses?",
        a: "Open any form and click the Responses tab in the topbar. The left panel lists all submissions; clicking one shows the full response detail on the right.",
      },
      {
        q: "Can I export responses?",
        a: "CSV and JSON export are available on the Team plan. On Free and Pro, you can view and copy individual responses from the Responses page.",
      },
    ],
  },
  {
    category: "Account",
    icon: MessageSquare,
    items: [
      {
        q: "How do I rename my workspace?",
        a: "Click your workspace name in the top-left of the sidebar to open Workspace Settings. Edit the name and hit Save changes.",
      },
      {
        q: "How do I change my plan?",
        a: "Go to Plan & Billing in the sidebar. You can compare plans and upgrade directly from there.",
      },
    ],
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="group"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left transition-colors duration-150"
      >
        <span
          className={`text-sm font-medium leading-relaxed transition-colors duration-150 ${open ? "text-[#F2F2F2]" : "text-[#C4C4C4] group-hover:text-[#F2F2F2]"}`}
        >
          {q}
        </span>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-[#4A4A4A] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-180 text-[#E8854A]" : "group-hover:text-[#6B6B6B]"}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-[#6B6B6B]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-px bg-white/[0.05]" />
    </motion.div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filtered = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        ({ q, a }) =>
          !search ||
          q.toLowerCase().includes(search.toLowerCase()) ||
          a.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-full bg-[#080808] text-[#F2F2F2]">
      <div className="pointer-events-none fixed left-1/2 top-0 -z-0 h-80 w-[500px] -translate-x-1/2 rounded-full bg-[#E8854A]/3 blur-[130px]" />

      <div className="relative mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="size-4 text-[#E8854A]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8854A]">
              Help & Support
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">How can we help?</h1>
          <p className="mt-1.5 text-sm text-[#6B6B6B]">
            Browse common questions or reach out directly.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="relative mb-8"
        >
          <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#4A4A4A]" />
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/6 bg-white/[0.03] pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#3A3A3A] outline-none transition-colors duration-200 focus:border-[#E8854A]/30 focus:bg-white/[0.04]"
          />
        </motion.div>

        {/* FAQ sections */}
        {filtered.length > 0 ? (
          <div className="space-y-8">
            {filtered.map((cat, ci) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + ci * 0.06, duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-1"
              >
                {/* Category header */}
                <div className="flex items-center gap-2 border-b border-white/[0.05] py-4">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-[#E8854A]/10">
                    <cat.icon className="size-3 text-[#E8854A]" />
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
                    {cat.category}
                  </span>
                </div>

                {/* FAQ items */}
                <div>
                  {cat.items.map((item, ii) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} index={ii} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen className="size-8 text-[#3A3A3A]" />
            <p className="text-sm text-[#4A4A4A]">No results for &quot;{search}&quot;</p>
          </div>
        )}

        {/* Contact card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="mt-8 rounded-2xl border border-white/6 bg-white/[0.02] p-6"
        >
          <div className="mb-1 flex items-center gap-2">
            <Mail className="size-4 text-[#6B6B6B]" />
            <span className="text-sm font-medium">Still stuck?</span>
          </div>
          <p className="mb-4 text-xs text-[#6B6B6B]">
            Our support team typically responds within a few hours.
          </p>
          <a
            href="mailto:support@formblox.com"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-[#C4C4C4] transition-all duration-200 hover:border-[#E8854A]/30 hover:text-[#E8854A]"
          >
            support@formblox.com
            <ExternalLink className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}

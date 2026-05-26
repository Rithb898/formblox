"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, Pencil, Trash2, Loader2, Globe, FileText, Inbox, Link2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { FieldType } from "@repo/forms";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";

const ACCENT = "#E8854A";
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

// Asymmetric bento spans cycled by index. Mobile collapses to full width.
const SPANS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-4",
];

type FormListItem = {
  id: string;
  publicSlug: string;
  isAcceptingResponses: boolean;
  createdAt: Date;
  title: string;
  status: string;
};

function StatusPill({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
        published
          ? "bg-[#E8854A]/12 text-[#E8854A]"
          : "bg-white/[0.06] text-[#6B6B6B]",
      )}
    >
      {published ? (
        <Globe className="size-2.5" />
      ) : (
        <FileText className="size-2.5" />
      )}
      {status}
    </span>
  );
}

function DeleteDialog({
  form,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  form: FormListItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete form?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{form?.title || "Untitled form"}</span> will
            be soft-deleted. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  delay,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  delay: number;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full",
        "bg-white/[0.04] text-[#8A8A8A] ring-1 ring-white/[0.06]",
        "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:scale-105 hover:bg-white/[0.08] hover:text-white",
        danger && "hover:bg-red-500/15 hover:text-red-400",
        "group-hover:animate-fade-up",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function FormCard({
  form,
  index,
  onDelete,
}: {
  form: FormListItem;
  index: number;
  onDelete: (form: FormListItem) => void;
}) {
  const router = useRouter();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  function copyLink() {
    const url = `${window.location.origin}/f/${form.publicSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied");
  }

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        SPANS[index % SPANS.length],
        "animate-fade-up col-span-1",
        // Outer double-bezel wrapper
        "group relative cursor-pointer rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:ring-white/[0.12]",
      )}
      onClick={() => router.push(`/forms/${form.id}/edit`)}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight border overlay — radial gradient follows cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(232,133,74,0.18), transparent 45%)",
        }}
      />

      {/* Inner core */}
      <div className="relative flex h-full min-h-[8.5rem] flex-col gap-4 overflow-hidden rounded-[1.4rem] bg-[#111] p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-white">
            {form.title || "Untitled form"}
          </h3>
          <StatusPill status={form.status} />
        </div>

        {/* Meta */}
        <div className="mt-auto flex flex-col gap-1.5">
          <p className="font-mono text-[11px] text-[#6B6B6B]">
            /f/{form.publicSlug}
          </p>
          <p className="font-mono text-[11px] text-[#5A5A5A]">
            created {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Quick actions — fade + slide up on hover, staggered */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 p-5",
            "bg-gradient-to-t from-[#111] via-[#111]/90 to-transparent pt-10",
            "translate-y-2 opacity-0",
            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
            "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
            "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <QuickAction
            icon={Pencil}
            label="Edit"
            delay={0}
            onClick={() => router.push(`/forms/${form.id}/edit`)}
          />
          <QuickAction
            icon={Inbox}
            label="Responses"
            delay={50}
            onClick={() => router.push(`/forms/${form.id}/responses`)}
          />
          <QuickAction icon={Link2} label="Copy link" delay={100} onClick={copyLink} />
          <QuickAction
            icon={Trash2}
            label="Delete"
            delay={150}
            danger
            onClick={() => onDelete(form)}
          />
        </div>
      </div>
    </div>
  );
}

function GenerateModal({
  open,
  onOpenChange,
  onGenerate,
  isPending,
  hasError,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerate: (prompt: string) => void;
  isPending: boolean;
  hasError: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    if (!prompt.trim()) return;
    onGenerate(prompt.trim());
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) { onOpenChange(v); if (!v) setPrompt(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#A78BFA]" />
            Generate form with AI
          </DialogTitle>
          <DialogDescription>
            Describe the form you want and AI will build it for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
            placeholder="e.g. a customer feedback form for a coffee shop, a job application form, a weekly team standup survey…"
            disabled={isPending}
            rows={4}
            className={cn(
              "w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3",
              "text-sm text-[#F2F2F2] placeholder:text-[#4A4A4A]",
              "outline-none focus:border-[#7C3AED]/40 focus:ring-1 focus:ring-[#7C3AED]/20",
              "transition-all duration-200 disabled:opacity-50",
            )}
          />
          {hasError && (
            <p className="text-xs text-red-400">
              Couldn&apos;t generate the form. Try rephrasing your prompt.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !prompt.trim()}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              "bg-[#7C3AED]/15 text-[#A78BFA] ring-1 ring-[#7C3AED]/25",
              "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:bg-[#7C3AED]/25 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {isPending ? "Generating…" : "Generate"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onNew, isPending }: { onNew: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="select-none text-6xl font-semibold tracking-tighter text-white/[0.06] sm:text-7xl">
        No forms yet
      </p>
      <button
        type="button"
        onClick={onNew}
        disabled={isPending}
        className={cn(
          "group mt-8 flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-[#E8854A]/30 px-12 py-8",
          "bg-[#E8854A]/[0.03] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "hover:border-[#E8854A]/60 hover:bg-[#E8854A]/[0.06] disabled:opacity-50",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-[#E8854A]/12 text-[#E8854A] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        </span>
        <span className="text-sm font-medium text-white">Create your first form</span>
        <span className="font-mono text-[11px] text-[#6B6B6B]">start collecting responses</span>
      </button>
    </div>
  );
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        SPANS[index % SPANS.length],
        "col-span-1 rounded-[1.75rem] bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]",
      )}
    >
      <div className="h-[8.5rem] animate-pulse overflow-hidden rounded-[1.4rem] bg-[#111]">
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

export default function FormsPage() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspaceId = workspacesQuery.data?.[0]?.id;

  const formsQuery = trpc.forms.list.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId },
  );

  const createMutation = trpc.forms.create.useMutation({
    onSuccess: (form) => router.push(`/forms/${form.id}/edit`),
    onError: () => toast.error("Failed to create form"),
  });

  const updateDraftMutation = trpc.forms.versions.updateDraft.useMutation();

  const deleteMutation = trpc.forms.softDelete.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      setDeleteTarget(null);
      toast.success("Form deleted");
    },
    onError: () => toast.error("Failed to delete form"),
  });

  const restoreMutation = trpc.forms.restore.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      toast.success("Form restored");
    },
    onError: () => toast.error("Failed to restore form"),
  });

  function handleNew() {
    if (!workspaceId) return;
    createMutation.mutate({ workspaceId, title: "Untitled form" });
  }

  async function handleGenerate(prompt: string) {
    if (!workspaceId) return;
    setGenerating(true);
    setGenerateError(false);
    try {
      // 1. Generate fields from AI
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("generation_failed");
      const { title, fields: generatedFields } = await res.json() as {
        title: string;
        fields: { type: string; label: string; required: boolean; config: Record<string, unknown> }[];
      };

      // 2. Create form
      const form = await createMutation.mutateAsync({ workspaceId, title: title || "Untitled form" });

      // 3. Populate draft with generated fields
      await updateDraftMutation.mutateAsync({
        formId: form.id,
        title: title || "Untitled form",
        fields: generatedFields.map((f, i) => ({
          id: nanoid(),
          order: i,
          type: f.type as FieldType,
          label: f.label,
          required: f.required,
          config: f.config,
        })),
      });

      setGenerateOpen(false);
      router.push(`/forms/${form.id}/edit`);
    } catch {
      setGenerateError(true);
      setGenerating(false);
    }
  }

  // restoreMutation preserved for soft-delete restore flow.
  void restoreMutation;

  const forms = formsQuery.data ?? [];
  const isLoading = workspacesQuery.isPending || formsQuery.isPending;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Page header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
        <h1 className="text-lg font-semibold tracking-tight text-white">Forms</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            disabled={!workspaceId}
            className={cn(
              "flex items-center gap-2 rounded-full py-1.5 pl-3 pr-4 text-sm font-medium",
              "bg-[#7C3AED]/10 text-[#A78BFA] ring-1 ring-[#7C3AED]/20",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:bg-[#7C3AED]/20 hover:ring-[#7C3AED]/40 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Sparkles className="size-3.5" />
            Generate with AI
          </button>
          <button
            type="button"
            onClick={handleNew}
            disabled={createMutation.isPending || !workspaceId}
            className={cn(
              "group flex items-center gap-2.5 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-medium",
              "bg-[#E8854A]/12 text-[#E8854A] ring-1 ring-[#E8854A]/20",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:bg-[#E8854A]/20 hover:ring-[#E8854A]/40 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            New form
            <span className="flex size-7 items-center justify-center rounded-full bg-[#E8854A] text-[#111] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-90">
              {createMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} index={i} />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState onNew={handleNew} isPending={createMutation.isPending} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {forms.map((form, i) => (
              <FormCard
                key={form.id}
                index={i}
                form={{ ...form, createdAt: new Date(form.createdAt) }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteDialog
        form={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ formId: deleteTarget.id })}
        isPending={deleteMutation.isPending}
      />

      <GenerateModal
        open={generateOpen}
        onOpenChange={(v) => { if (!generating) { setGenerateOpen(v); if (!v) { setGenerating(false); setGenerateError(false); } } }}
        onGenerate={handleGenerate}
        isPending={generating}
        hasError={generateError}
      />
    </div>
  );
}

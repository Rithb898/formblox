"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Save,
  Globe,
  Loader2,
  Check,
  Inbox,
  ChevronLeft,
  Lock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { useFormEditorStore } from "~/stores/form-editor";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

function TimeAgo({ date }: { date: Date }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      const secs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (secs < 5) setLabel("just now");
      else if (secs < 60) setLabel(`${secs}s ago`);
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)}m ago`);
      else setLabel(`${Math.floor(secs / 3600)}h ago`);
    }
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [date]);

  return <span>{label}</span>;
}

export function EditorTopbar({
  formId,
  publicSlug,
  visibility: initialVisibility,
}: {
  formId: string;
  publicSlug: string | null;
  visibility: "public" | "unlisted";
}) {
  const [visibility, setVisibilityState] = useState<"public" | "unlisted">(initialVisibility);
  const {
    formVersion,
    fields,
    dirty,
    lastSavedAt,
    isSaving,
    setIsSaving,
    markSaved,
    selectField,
    setFieldErrors,
    clearFieldErrors,
  } = useFormEditorStore();

  const titleRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const updateDraft = trpc.forms.versions.updateDraft.useMutation();
  const publish = trpc.forms.versions.publish.useMutation();
  const setVisibilityMutation = trpc.forms.setVisibility.useMutation();

  async function handleToggleVisibility() {
    const next = visibility === "public" ? "unlisted" : "public";
    setVisibilityState(next);
    try {
      await setVisibilityMutation.mutateAsync({ formId, visibility: next });
      toast.success(next === "public" ? "Form is now public" : "Form is now unlisted");
    } catch {
      setVisibilityState(visibility);
      toast.error("Failed to update visibility");
    }
  }

  const save = useCallback(async () => {
    if (!formVersion || isSaving) return;
    setIsSaving(true);
    try {
      const data = await updateDraft.mutateAsync({
        formId,
        title: formVersion.title,
        description: formVersion.description ?? undefined,
        fields: fields.map((f) => ({
          id: f.id,
          order: f.order,
          type: f.type as
            | "number"
            | "date"
            | "email"
            | "short_text"
            | "long_text"
            | "single_choice"
            | "multiple_choice"
            | "rating",
          label: f.label,
          required: f.required,
          config: f.config,
        })),
      });
      utils.forms.versions.getDraft.setData({ formId }, data);
      markSaved();
    } catch {
      setIsSaving(false);
      toast.error("Failed to save");
    }
  }, [formVersion, fields, isSaving, formId]);

  // Cmd+S
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  function validateFieldsForPublish(): Record<string, string> | null {
    const errors: Record<string, string> = {};
    if (!formVersion?.title?.trim()) return null; // handled separately via titleRef
    for (const f of fields) {
      if (!f.label?.trim()) {
        errors[f.id] = "Label is required";
        continue;
      }
      if (f.type === "single_choice" || f.type === "multiple_choice") {
        const options =
          (f.config.options as Array<{ id: string; label: string }> | undefined) ?? [];
        const filled = options.filter((o) => o.label?.trim());
        if (filled.length < 2) errors[f.id] = "Add at least 2 options";
      } else if (f.type === "rating") {
        const scale = f.config.scale;
        const style = f.config.style;
        if (scale !== 5 && scale !== 10) errors[f.id] = "Select a rating scale";
        else if (style !== "star" && style !== "number") errors[f.id] = "Select a rating style";
      }
    }
    return Object.keys(errors).length > 0 ? errors : null;
  }

  function scrollToField(id: string) {
    document
      .querySelector(`[data-field-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handlePublish() {
    clearFieldErrors();

    if (!formVersion?.title?.trim()) {
      titleRef.current?.focus();
      toast.error("Form title is required before publishing.");
      return;
    }

    const errors = validateFieldsForPublish();
    if (errors) {
      setFieldErrors(errors);
      const firstId = Object.keys(errors)[0]!;
      selectField(firstId);
      scrollToField(firstId);
      return;
    }

    await save();
    try {
      await publish.mutateAsync({ formId });
      await utils.forms.versions.getDraft.invalidate({ formId });
      void utils.forms.list.invalidate();
      const url = `${window.location.origin}/f/${publicSlug}`;
      toast.success("Published!", {
        description: url,
        action: {
          label: "Copy link",
          onClick: () => navigator.clipboard.writeText(url),
        },
        duration: 8000,
      });
    } catch {
      toast.error("Publish failed");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between rounded-2xl bg-white/2 px-3 ring-1 ring-white/6 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
      {/* Back + Title */}
      <div className="flex min-w-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              className="shrink-0 rounded-full text-[#6B6B6B] hover:bg-white/6 hover:text-[#F2F2F2]"
            >
              <a href="/forms" aria-label="Back to forms">
                <ChevronLeft className="size-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to forms</TooltipContent>
        </Tooltip>
        <input
          ref={titleRef}
          className={cn(
            "min-w-0 max-w-65 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-medium tracking-tight text-[#F2F2F2] outline-none",
            "ring-1 ring-transparent transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-white/7 focus:bg-white/3 focus:ring-[#E8854A]/60",
            "placeholder:text-[#6B6B6B]",
          )}
          value={formVersion?.title ?? ""}
          placeholder="Untitled form"
          onChange={(e) => {
            if (!formVersion) return;
            useFormEditorStore.setState((s) => ({
              formVersion: s.formVersion ? { ...s.formVersion, title: e.target.value } : null,
              dirty: true,
            }));
          }}
        />
        <span className="font-mono text-[11px] text-[#6B6B6B]">
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin text-[#E8854A]" /> saving…
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1.5 text-[#6B6B6B]">
              <Check className="size-3 text-[#E8854A]" /> <TimeAgo date={lastSavedAt} />
            </span>
          ) : dirty ? (
            <span className="text-[#6B6B6B]">unsaved</span>
          ) : null}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              className="rounded-full text-[#6B6B6B] hover:bg-white/6 hover:text-[#F2F2F2]"
            >
              <a href={`/forms/${formId}/responses`} aria-label="View responses">
                <Inbox className="size-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View responses</TooltipContent>
        </Tooltip>
        {publicSlug && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                asChild
                className="rounded-full text-[#6B6B6B] hover:bg-white/6 hover:text-[#F2F2F2]"
              >
                <a
                  href={`/f/${publicSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open public form"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open public form</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
              disabled={setVisibilityMutation.isPending}
              className={cn(
                "gap-1.5 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-[0.08em]",
                "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                visibility === "public"
                  ? "bg-[#E8854A]/12 text-[#E8854A] hover:bg-[#E8854A]/20"
                  : "bg-white/4 text-[#6B6B6B] hover:bg-white/8 hover:text-[#F2F2F2]",
              )}
            >
              {visibility === "public" ? <Eye className="size-3" /> : <Lock className="size-3" />}
              {visibility}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {visibility === "public"
              ? "Public — visible on explore page"
              : "Unlisted — only via direct link"}
          </TooltipContent>
        </Tooltip>
        <div className="mx-1 h-5 w-px bg-white/7" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={save}
              disabled={!dirty || isSaving}
              className="gap-1.5 rounded-full bg-white/4 text-[#F2F2F2] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 disabled:opacity-40 active:scale-[0.98]\"
            >
              <Save className="size-3.5" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save draft (⌘S)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publish.isPending || isSaving}
              className="gap-1.5 rounded-full bg-[#E8854A] text-[#0a0a0a] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#E8854A]/90 disabled:opacity-40 active:scale-[0.98]"
            >
              {publish.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Globe className="size-3.5" />
              )}
              Publish
            </Button>
          </TooltipTrigger>
          <TooltipContent>Make live for respondents</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

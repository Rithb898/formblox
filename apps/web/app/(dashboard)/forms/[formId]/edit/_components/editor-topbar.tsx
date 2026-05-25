"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Save, Globe, Loader2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { useFormEditorStore } from "~/stores/form-editor";
import { Button } from "~/components/ui/button";
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

export function EditorTopbar({ formId, publicSlug }: { formId: string; publicSlug: string | null }) {
  const { formVersion, fields, dirty, lastSavedAt, isSaving, setIsSaving, markSaved, updateField } =
    useFormEditorStore();

  const titleRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const updateDraft = trpc.forms.versions.updateDraft.useMutation();
  const publish = trpc.forms.versions.publish.useMutation();

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
          type: f.type,
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

  async function handlePublish() {
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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Title */}
      <div className="flex min-w-0 items-center gap-3">
        <input
          ref={titleRef}
          className={cn(
            "min-w-0 max-w-65 truncate bg-transparent text-sm font-medium text-foreground outline-none",
            "border-b border-transparent hover:border-border focus:border-ring transition-colors",
            "placeholder:text-muted-foreground",
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
        <span className="text-xs text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> Saving…
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1 text-muted-foreground/60">
              <Check className="size-3" /> <TimeAgo date={lastSavedAt} />
            </span>
          ) : dirty ? (
            <span className="text-muted-foreground/60">Unsaved</span>
          ) : null}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {publicSlug && (
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <a href={`/f/${publicSlug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={save}
          disabled={!dirty || isSaving}
          className="gap-1.5"
        >
          <Save className="size-3.5" />
          Save
        </Button>
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={publish.isPending || isSaving}
          className="gap-1.5"
        >
          {publish.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
          Publish
        </Button>
      </div>
    </header>
  );
}

"use client";

import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export function RatingPanel({ field }: { field: EditorField }) {
  const updateField = useFormEditorStore((s) => s.updateField);
  const config = field.config as { scale?: number; style?: string };
  const scale = (config.scale as 5 | 10) ?? 5;
  const style = (config.style as "star" | "number") ?? "star";

  function updateConfig(patch: Partial<typeof config>) {
    updateField(field.id, { config: { ...config, ...patch } });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Question
        </Label>
        <Input
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="Enter your question"
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Scale</p>
        <div className="flex overflow-hidden rounded-md border border-border">
          {([5, 10] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateConfig({ scale: n })}
              className={cn(
                "flex-1 py-1.5 text-sm transition-colors",
                scale === n
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Style</p>
        <div className="flex overflow-hidden rounded-md border border-border">
          {(["star", "number"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateConfig({ style: s })}
              className={cn(
                "flex-1 py-1.5 text-sm capitalize transition-colors",
                style === s
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Required</p>
            <p className="text-xs text-muted-foreground">Respondent must answer</p>
          </div>
          <Switch
            checked={field.required}
            onCheckedChange={(v) => updateField(field.id, { required: v })}
          />
        </div>
      </div>
    </div>
  );
}

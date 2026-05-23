"use client";

import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function LongTextPanel({ field }: { field: EditorField }) {
  const updateField = useFormEditorStore((s) => s.updateField);
  const config = field.config as { placeholder?: string; minLength?: number; maxLength?: number };

  function update(patch: Partial<EditorField>) {
    updateField(field.id, patch);
  }

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
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Enter your question"
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Placeholder
        </Label>
        <Input
          value={config.placeholder ?? ""}
          onChange={(e) => updateConfig({ placeholder: e.target.value || undefined })}
          placeholder="Type your answer…"
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Required</p>
            <p className="text-xs text-muted-foreground">Respondent must answer</p>
          </div>
          <Switch
            checked={field.required}
            onCheckedChange={(v) => update({ required: v })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Length limits
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <Input
              type="number"
              min={0}
              value={config.minLength ?? ""}
              onChange={(e) => updateConfig({ minLength: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="—"
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Max</Label>
            <Input
              type="number"
              min={1}
              value={config.maxLength ?? ""}
              onChange={(e) => updateConfig({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="—"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

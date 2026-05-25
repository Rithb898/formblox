"use client";

import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function EmailPanel({ field }: { field: EditorField }) {
  const updateField = useFormEditorStore((s) => s.updateField);
  const config = field.config as { placeholder?: string };

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

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Placeholder
        </Label>
        <Input
          value={config.placeholder ?? ""}
          onChange={(e) =>
            updateField(field.id, { config: { ...config, placeholder: e.target.value || undefined } })
          }
          placeholder="your@email.com"
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
            onCheckedChange={(v) => updateField(field.id, { required: v })}
          />
        </div>
      </div>
    </div>
  );
}

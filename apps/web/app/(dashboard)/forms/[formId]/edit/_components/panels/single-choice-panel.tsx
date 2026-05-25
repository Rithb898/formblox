"use client";

import { nanoid } from "nanoid";
import { Plus, X } from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";

type Option = { id: string; label: string };

export function SingleChoicePanel({ field }: { field: EditorField }) {
  const updateField = useFormEditorStore((s) => s.updateField);
  const config = field.config as { options: Option[] };
  const options = config.options ?? [];

  function setOptions(next: Option[]) {
    updateField(field.id, { config: { ...config, options: next } });
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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Options
        </p>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Input
                value={opt.label}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...opt, label: e.target.value };
                  setOptions(next);
                }}
                placeholder={`Option ${i + 1}`}
                className="text-sm"
              />
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                disabled={options.length <= 1}
                className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive disabled:opacity-30"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOptions([...options, { id: nanoid(), label: "" }])}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Add option
        </Button>
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

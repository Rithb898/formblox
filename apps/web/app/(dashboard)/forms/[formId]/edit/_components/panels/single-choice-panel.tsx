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
    <div className="flex animate-fade-up flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Question
        </Label>
        <Input
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value })}
          placeholder="Enter your question"
          className="border-white/[0.07] bg-white/[0.02] text-sm text-[#F2F2F2] focus-visible:ring-[#E8854A]/40"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
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
                className="border-white/[0.07] bg-white/[0.02] text-sm text-[#F2F2F2] focus-visible:ring-[#E8854A]/40"
              />
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                disabled={options.length <= 1}
                aria-label="Remove option"
                className="shrink-0 rounded-full p-1 text-[#6B6B6B] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.06] hover:text-[#E8854A] disabled:opacity-30"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOptions([...options, { id: nanoid(), label: "" }])}
          className="gap-1.5 rounded-full bg-white/[0.04] text-[#F2F2F2] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <Plus className="size-3.5" />
          Add option
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#F2F2F2]">Required</p>
            <p className="text-xs text-[#6B6B6B]">Respondent must answer</p>
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

"use client";

import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function NumberPanel({ field }: { field: EditorField }) {
  const updateField = useFormEditorStore((s) => s.updateField);
  const config = field.config as { placeholder?: string; min?: number; max?: number };

  function updateConfig(patch: Partial<typeof config>) {
    updateField(field.id, { config: { ...config, ...patch } });
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

      <div className="flex flex-col gap-2">
        <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Placeholder
        </Label>
        <Input
          value={config.placeholder ?? ""}
          onChange={(e) => updateConfig({ placeholder: e.target.value || undefined })}
          placeholder="Enter a number…"
          className="border-white/[0.07] bg-white/[0.02] text-sm text-[#F2F2F2] focus-visible:ring-[#E8854A]/40"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">Range</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[11px] text-[#6B6B6B]">Min</Label>
            <Input
              type="number"
              value={config.min ?? ""}
              onChange={(e) =>
                updateConfig({ min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="—"
              className="border-white/[0.07] bg-white/[0.02] text-sm text-[#F2F2F2] focus-visible:ring-[#E8854A]/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-mono text-[11px] text-[#6B6B6B]">Max</Label>
            <Input
              type="number"
              value={config.max ?? ""}
              onChange={(e) =>
                updateConfig({ max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="—"
              className="border-white/[0.07] bg-white/[0.02] text-sm text-[#F2F2F2] focus-visible:ring-[#E8854A]/40"
            />
          </div>
        </div>
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

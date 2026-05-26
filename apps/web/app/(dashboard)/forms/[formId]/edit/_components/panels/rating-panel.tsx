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
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">Scale</p>
        <div className="flex gap-1.5 rounded-full bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
          {([5, 10] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateConfig({ scale: n })}
              className={cn(
                "flex-1 rounded-full py-1.5 font-mono text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                scale === n
                  ? "bg-[#E8854A] text-[#0a0a0a]"
                  : "text-[#6B6B6B] hover:bg-white/[0.05] hover:text-[#F2F2F2]",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">Style</p>
        <div className="flex gap-1.5 rounded-full bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
          {(["star", "number"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateConfig({ style: s })}
              className={cn(
                "flex-1 rounded-full py-1.5 text-sm capitalize transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                style === s
                  ? "bg-[#E8854A] text-[#0a0a0a]"
                  : "text-[#6B6B6B] hover:bg-white/[0.05] hover:text-[#F2F2F2]",
              )}
            >
              {s}
            </button>
          ))}
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

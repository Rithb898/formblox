"use client";

import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import { THEME_PRESETS } from "@repo/forms/theme";
import type { ThemePresetKey } from "@repo/forms/theme";
import { themeToCSSVars } from "~/lib/theme";
import { cn } from "~/lib/utils";

const PRESET_ENTRIES: Array<{ key: ThemePresetKey; name: string; accent: string }> =
  Object.entries(THEME_PRESETS).map(([key, val]) => ({
    key: key as ThemePresetKey,
    name: val.name,
    accent: val.accent,
  }));

export function ThemePanel() {
  const { theme, setTheme } = useFormEditorStore();
  const cssVars = themeToCSSVars(theme);

  const currentAccent = theme?.accentColor ?? THEME_PRESETS.sunset.accent;
  const currentPreset = theme?.preset ?? "sunset";
  const aiOverride = theme?.aiAccentColor;
  const currentAiAccent = aiOverride ?? currentAccent;

  const handlePresetClick = useCallback(
    (key: ThemePresetKey) => {
      setTheme({
        preset: key,
        accentColor: THEME_PRESETS[key].accent,
        ...(aiOverride ? { aiAccentColor: aiOverride } : {}),
      });
    },
    [setTheme, aiOverride],
  );

  const handleColorChange = useCallback(
    (hex: string) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;

      const matchingPreset = PRESET_ENTRIES.find(
        (p) => p.accent.toLowerCase() === hex.toLowerCase(),
      );
      setTheme({
        preset: matchingPreset ? matchingPreset.key : "custom",
        accentColor: hex,
        ...(aiOverride ? { aiAccentColor: aiOverride } : {}),
      });
    },
    [setTheme, aiOverride],
  );

  const handleAiColorChange = useCallback(
    (hex: string) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
      setTheme({ preset: currentPreset, accentColor: currentAccent, aiAccentColor: hex });
    },
    [setTheme, currentPreset, currentAccent],
  );

  const handleAiColorReset = useCallback(() => {
    setTheme({ preset: currentPreset, accentColor: currentAccent });
  }, [setTheme, currentPreset, currentAccent]);

  return (
    <div className="flex animate-fade-up flex-col gap-5" style={cssVars}>
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Presets
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_ENTRIES.map((p) => {
            const isSelected =
              currentPreset === p.key && currentAccent.toLowerCase() === p.accent.toLowerCase();
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetClick(p.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200 hover:bg-white/4",
                  isSelected && "ring-2 ring-(--form-accent) bg-white/3",
                )}
              >
                <span
                  className="block size-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: p.accent }}
                />
                <span className="font-mono text-[10px] text-[#6B6B6B]">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/[0.07] pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Custom accent
        </p>
        <div className="flex items-center gap-2">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg">
            <input
              type="color"
              value={currentAccent}
              onChange={(e) => handleColorChange(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer border-0 p-0 opacity-0"
              aria-label="Pick accent color"
            />
            <span
              className="block size-full rounded-lg"
              style={{ backgroundColor: currentAccent }}
            />
          </div>
          <input
            type="text"
            value={currentAccent}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#E8854A"
            className="flex-1 rounded-lg border border-white/[0.07] bg-white/2 px-3 py-2 font-mono text-xs text-[#F2F2F2] outline-none transition-colors focus:border-(--form-accent)/40 focus:bg-white/4"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/[0.07] pt-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B6B6B]">
            <Sparkles className="size-3" />
            AI accent
          </p>
          {aiOverride ? (
            <button
              type="button"
              onClick={handleAiColorReset}
              className="cursor-pointer font-mono text-[10px] text-[#6B6B6B] underline-offset-2 transition-colors hover:text-[#F2F2F2] hover:underline"
            >
              Reset to accent
            </button>
          ) : (
            <span className="font-mono text-[10px] text-[#3A3A3A]">Same as accent</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg">
            <input
              type="color"
              value={currentAiAccent}
              onChange={(e) => handleAiColorChange(e.target.value)}
              className="absolute inset-0 size-full cursor-pointer border-0 p-0 opacity-0"
              aria-label="Pick AI accent color"
            />
            <span
              className={cn("block size-full rounded-lg", !aiOverride && "opacity-50")}
              style={{ backgroundColor: currentAiAccent }}
            />
          </div>
          <input
            type="text"
            value={currentAiAccent}
            onChange={(e) => handleAiColorChange(e.target.value)}
            placeholder={currentAccent}
            className={cn(
              "flex-1 rounded-lg border border-white/[0.07] bg-white/2 px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-(--form-accent)/40 focus:bg-white/4",
              aiOverride ? "text-[#F2F2F2]" : "text-[#6B6B6B]",
            )}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-[#6B6B6B]">
          Colors the AI follow-up avatar and badge. Inherits the form accent until you pick one.
        </p>
      </div>
    </div>
  );
}

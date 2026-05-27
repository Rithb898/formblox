"use client";

import { useCallback } from "react";
import { Palette } from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import { THEME_PRESETS } from "@repo/forms/theme";
import type { FormTheme, ThemePresetKey } from "@repo/forms/theme";
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

  const handlePresetClick = useCallback(
    (key: ThemePresetKey) => {
      setTheme({ preset: key, accentColor: THEME_PRESETS[key].accent });
    },
    [setTheme],
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
      });
    },
    [setTheme],
  );

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
                  "flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200 hover:bg-white/[0.04]",
                  isSelected && "ring-2 ring-[var(--form-accent)] bg-white/[0.03]",
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
            className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono text-xs text-[#F2F2F2] outline-none transition-colors focus:border-[var(--form-accent)]/40 focus:bg-white/[0.04]"
          />
        </div>
      </div>
    </div>
  );
}

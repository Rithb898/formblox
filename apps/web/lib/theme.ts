import type { FormTheme } from "@repo/forms/theme";
import { THEME_PRESETS } from "@repo/forms/theme";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeOnAccentColor(hex: string): "#0a0a0a" | "#FFFFFF" {
  return luminance(hex) > 0.5 ? "#0a0a0a" : "#FFFFFF";
}

const DEFAULTS = {
  bg: "#080808",
  surface: "#141414",
  surfaceElevated: "#1A1A1A",
  avatarBg: "#1E1E1E",
  textPrimary: "#F2F2F2",
  textMuted: "#6B6B6B",
  textLabel: "#9B9B9B",
};

export function themeToCSSVars(
  theme: FormTheme | null | undefined,
): Record<string, string> {
  const accent = theme?.accentColor ?? THEME_PRESETS.sunset.accent;

  return {
    "--form-accent": accent,
    "--form-text-on-accent": computeOnAccentColor(accent),
    "--form-bg": DEFAULTS.bg,
    "--form-surface": DEFAULTS.surface,
    "--form-surface-elevated": DEFAULTS.surfaceElevated,
    "--form-avatar-bg": DEFAULTS.avatarBg,
    "--form-text-primary": DEFAULTS.textPrimary,
    "--form-text-muted": DEFAULTS.textMuted,
    "--form-text-label": DEFAULTS.textLabel,
  };
}

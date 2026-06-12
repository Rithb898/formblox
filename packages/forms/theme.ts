import { z } from "zod";

export const THEME_PRESETS = {
  sunset: { name: "Sunset", accent: "#E8854A" },
  ocean: { name: "Ocean", accent: "#3B82F6" },
  forest: { name: "Forest", accent: "#10B981" },
  midnight: { name: "Midnight", accent: "#8B5CF6" },
  rose: { name: "Rose", accent: "#EC4899" },
} as const;

export type ThemePresetKey = keyof typeof THEME_PRESETS;

export const themeSchema = z.object({
  preset: z.enum(["sunset", "ocean", "forest", "midnight", "rose", "custom"]),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  // Absent = inherit accentColor. Only set when the owner deliberately forks the AI color.
  aiAccentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type FormTheme = z.infer<typeof themeSchema>;

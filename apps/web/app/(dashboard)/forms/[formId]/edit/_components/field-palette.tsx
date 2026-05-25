"use client";

import { Type, AlignLeft, Mail, Hash, CircleDot, SquareCheck, Star, Calendar } from "lucide-react";
import { nanoid } from "nanoid";
import { useFormEditorStore } from "~/stores/form-editor";
import { cn } from "~/lib/utils";

const FIELD_GROUPS = [
  {
    label: "Text",
    types: [
      { type: "short_text", label: "Short text", description: "Single line answer", icon: Type, defaultConfig: {} },
      { type: "long_text", label: "Long text", description: "Multi-line answer", icon: AlignLeft, defaultConfig: {} },
      { type: "email", label: "Email", description: "Email address", icon: Mail, defaultConfig: {} },
      { type: "number", label: "Number", description: "Numeric answer", icon: Hash, defaultConfig: {} },
    ],
  },
  {
    label: "Choice",
    types: [
      {
        type: "single_choice",
        label: "Single choice",
        description: "Pick one option",
        icon: CircleDot,
        defaultConfig: {
          options: [
            { id: nanoid(), label: "Option 1" },
            { id: nanoid(), label: "Option 2" },
          ],
        },
      },
      {
        type: "multiple_choice",
        label: "Multiple choice",
        description: "Pick many options",
        icon: SquareCheck,
        defaultConfig: {
          options: [
            { id: nanoid(), label: "Option 1" },
            { id: nanoid(), label: "Option 2" },
          ],
        },
      },
    ],
  },
  {
    label: "Other",
    types: [
      {
        type: "rating",
        label: "Rating",
        description: "Star or number scale",
        icon: Star,
        defaultConfig: { scale: 5, style: "star" },
      },
      { type: "date", label: "Date", description: "Date picker", icon: Calendar, defaultConfig: {} },
    ],
  },
] as const;

export function FieldPalette() {
  const addField = useFormEditorStore((s) => s.addField);
  const fields = useFormEditorStore((s) => s.fields);

  function handleAdd(type: string, defaultConfig: Record<string, unknown>) {
    addField({
      id: nanoid(),
      order: fields.length,
      type,
      label: "",
      required: false,
      config: defaultConfig,
    });
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Fields
        </span>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-3">
        {FIELD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.types.map(({ type, label, description, icon: Icon, defaultConfig }) => (
                <button
                  key={type}
                  onClick={() => handleAdd(type, defaultConfig as Record<string, unknown>)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-all",
                    "hover:border-border hover:bg-accent",
                    "active:scale-[0.98]",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors group-hover:border-ring/40 group-hover:text-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

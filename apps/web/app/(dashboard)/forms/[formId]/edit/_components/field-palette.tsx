"use client";

import { useDraggable } from "@dnd-kit/core";
import { Type, AlignLeft, Mail, Hash, CircleDot, SquareCheck, Star, Calendar } from "lucide-react";
import { nanoid } from "nanoid";
import { useFormEditorStore } from "~/stores/form-editor";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export type PaletteFieldDef = {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultConfig: Record<string, unknown>;
};

export const FIELD_GROUPS: Array<{ label: string; types: PaletteFieldDef[] }> = [
  {
    label: "Text",
    types: [
      {
        type: "short_text",
        label: "Short text",
        description: "Single line answer",
        icon: Type,
        defaultConfig: {},
      },
      {
        type: "long_text",
        label: "Long text",
        description: "Multi-line answer",
        icon: AlignLeft,
        defaultConfig: {},
      },
      {
        type: "email",
        label: "Email",
        description: "Email address",
        icon: Mail,
        defaultConfig: {},
      },
      {
        type: "number",
        label: "Number",
        description: "Numeric answer",
        icon: Hash,
        defaultConfig: {},
      },
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
      {
        type: "date",
        label: "Date",
        description: "Date picker",
        icon: Calendar,
        defaultConfig: {},
      },
    ],
  },
];

function PaletteItem({
  type,
  label,
  description,
  icon: Icon,
  defaultConfig,
  groupIndex,
  typeIndex,
}: {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultConfig: Record<string, unknown>;
  groupIndex: number;
  typeIndex: number;
}) {
  const addField = useFormEditorStore((s) => s.addField);
  const fields = useFormEditorStore((s) => s.fields);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${type}`,
  });

  function handleAdd() {
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
    <Button
      ref={setNodeRef}
      type="button"
      title={description}
      onClick={handleAdd}
      style={{ animationDelay: `${(groupIndex * 3 + typeIndex) * 35}ms` }}
      className={cn(
        "group flex w-full animate-fade-up items-center justify-start gap-2.5 rounded-full bg-white/[0.02] px-2.5 py-2 text-left ring-1 ring-white/[0.06]",
        "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:bg-white/[0.05] hover:ring-[#E8854A]/30",
        "active:scale-[0.98]",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.03] text-[#6B6B6B] ring-1 ring-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-[#E8854A]/10 group-hover:text-[#E8854A] group-hover:ring-[#E8854A]/30">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 truncate font-mono text-[12px] text-[#F2F2F2]">{label}</span>
    </Button>
  );
}

export function FieldPalette() {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0d0d0d]">
      <div className="flex h-14 shrink-0 items-center border-b border-white/[0.07] px-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Fields
        </span>
      </div>
      <div className="flex flex-col gap-5 overflow-y-auto p-3">
        {FIELD_GROUPS.map((group, gi) => (
          <div key={group.label}>
            <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#3A3A3A]">
              {group.label}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.types.map(({ type, label, description, icon, defaultConfig }, ti) => (
                <PaletteItem
                  key={type}
                  type={type}
                  label={label}
                  description={description}
                  icon={icon}
                  defaultConfig={defaultConfig as Record<string, unknown>}
                  groupIndex={gi}
                  typeIndex={ti}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Type,
  AlignLeft,
  Mail,
  Hash,
  CircleDot,
  SquareCheck,
  Star,
  Calendar,
} from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import type { EditorField } from "~/stores/form-editor";
import { cn } from "~/lib/utils";

const TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
  short_text: { icon: Type, label: "Short text" },
  long_text: { icon: AlignLeft, label: "Long text" },
  email: { icon: Mail, label: "Email" },
  number: { icon: Hash, label: "Number" },
  single_choice: { icon: CircleDot, label: "Single choice" },
  multiple_choice: { icon: SquareCheck, label: "Multiple choice" },
  rating: { icon: Star, label: "Rating" },
  date: { icon: Calendar, label: "Date" },
};

export function FieldCard({ field, index = 0 }: { field: EditorField; index?: number }) {
  const { selectedFieldId, selectField, removeField } = useFormEditorStore();
  const isSelected = selectedFieldId === field.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 40}ms`,
  };

  const meta = TYPE_META[field.type] ?? { icon: Type, label: field.type };
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={cn(
        "group relative flex animate-fade-up cursor-pointer items-center gap-3 rounded-[1.25rem] bg-white/[0.02] px-4 py-3.5 ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isSelected
          ? "border-l-2 border-[#E8854A] bg-[#E8854A]/[0.06] ring-[#E8854A]/30"
          : "ring-white/[0.06] hover:bg-white/[0.04] hover:ring-white/[0.12]",
        isDragging && "opacity-50",
      )}
    >
      {/* Q-number */}
      <span className="shrink-0 font-mono text-[11px] text-[#6B6B6B]">Q{index + 1}</span>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab touch-none text-transparent transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-[#6B6B6B] hover:!text-[#F2F2F2] active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Type icon */}
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isSelected
            ? "bg-[#E8854A]/10 text-[#E8854A] ring-[#E8854A]/30"
            : "bg-white/[0.03] text-[#6B6B6B] ring-white/[0.06]",
        )}
      >
        <Icon className="size-3.5" />
      </span>

      {/* Label */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm", field.label ? "text-[#F2F2F2]" : "text-[#6B6B6B]")}>
          {field.label || "(Untitled)"}
        </span>
        <span className="font-mono text-[11px] text-[#6B6B6B]">{meta.label}</span>
      </div>

      {/* Required badge */}
      {field.required && (
        <span className="shrink-0 font-mono text-xs font-medium text-[#E8854A]">*</span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
        aria-label="Delete field"
        className="shrink-0 rounded-full p-1 text-transparent transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-[#6B6B6B] hover:!bg-white/[0.06] hover:!text-[#E8854A]"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

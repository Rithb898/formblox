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
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
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
  const { selectedFieldId, selectField, removeField, fieldErrors } = useFormEditorStore();
  const isSelected = selectedFieldId === field.id;
  const error = fieldErrors[field.id];

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
    <div data-field-id={field.id} className="flex flex-col gap-1">
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={cn(
        "group relative flex animate-fade-up cursor-pointer items-center gap-3 rounded-[1.25rem] bg-white/2 px-4 py-3.5 ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isSelected
          ? "border-l-2 border-[#E8854A] bg-[#E8854A]/6 ring-[#E8854A]/30"
          : error
            ? "border-l-2 border-red-500 bg-red-500/5 ring-red-500/30 hover:ring-red-500/50"
            : "ring-white/6 hover:bg-white/4 hover:ring-white/12",
        isDragging && "opacity-50",
      )}
    >
      {/* Q-number */}
      <span className="shrink-0 font-mono text-[11px] text-[#6B6B6B]">Q{index + 1}</span>

      {/* Drag handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...(attributes as React.ComponentProps<"button">)}
            {...(listeners as React.ComponentProps<"button">)}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to reorder"
            className="shrink-0 cursor-grab touch-none text-transparent hover:bg-transparent hover:text-[#6B6B6B] group-hover:text-[#6B6B6B] active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>

      {/* Type icon */}
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isSelected
            ? "bg-[#E8854A]/10 text-[#E8854A] ring-[#E8854A]/30"
            : "bg-white/3 text-[#6B6B6B] ring-white/6",
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              removeField(field.id);
            }}
            aria-label="Delete field"
            className="shrink-0 text-transparent hover:bg-white/6 hover:text-[#E8854A] group-hover:text-[#6B6B6B]"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete field</TooltipContent>
      </Tooltip>
    </div>
    {error && (
      <p className="px-4 font-mono text-[11px] text-red-400">{error}</p>
    )}
    </div>
  );
}

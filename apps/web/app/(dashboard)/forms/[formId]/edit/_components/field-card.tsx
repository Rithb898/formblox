"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Type, AlignLeft, Mail, Hash, CircleDot, SquareCheck, Star, Calendar } from "lucide-react";
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

export function FieldCard({ field }: { field: EditorField }) {
  const { selectedFieldId, selectField, removeField } = useFormEditorStore();
  const isSelected = selectedFieldId === field.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = TYPE_META[field.type] ?? { icon: Type, label: field.type };
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-all",
        isSelected
          ? "border-orange-400/40 bg-orange-400/5 ring-1 ring-orange-400/20"
          : "border-border hover:border-border/80 hover:bg-accent/40",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      {/* Selection accent */}
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-orange-400" />
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 cursor-grab touch-none text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Type icon */}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
        <Icon className="size-3.5" />
      </span>

      {/* Label */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm", field.label ? "text-foreground" : "text-muted-foreground/50")}>
          {field.label || "Untitled question"}
        </span>
        <span className="text-xs text-muted-foreground/60">{meta.label}</span>
      </div>

      {/* Required badge */}
      {field.required && (
        <span className="shrink-0 text-xs font-medium text-orange-400">*</span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
        className="shrink-0 rounded p-1 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/40 hover:!text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

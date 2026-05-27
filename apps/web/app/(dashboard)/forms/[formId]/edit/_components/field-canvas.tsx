"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutGrid } from "lucide-react";
import { cn } from "~/lib/utils";
import { useFormEditorStore } from "~/stores/form-editor";
import { FieldCard } from "./field-card";

export function FieldCanvas() {
  const { fields } = useFormEditorStore();

  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-1 flex-col overflow-y-auto bg-[#080808] transition-colors duration-150",
        isOver && "bg-[#E8854A]/3",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/7 px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6B6B6B]">
          Canvas
        </span>
        {fields.length > 0 && (
          <span className="font-mono text-[11px] text-[#6B6B6B]">
            {fields.length} {fields.length === 1 ? "field" : "fields"}
          </span>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        {fields.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-4 text-center transition-opacity duration-150",
              isOver && "opacity-60",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/2 ring-1 ring-white/6">
              <LayoutGrid className="size-5 text-[#6B6B6B]" />
            </div>
            <p className="text-sm text-[#6B6B6B]">Add a field from the left to get started</p>
          </div>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {fields.map((field, i) => (
                <FieldCard key={field.id} field={field} index={i} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

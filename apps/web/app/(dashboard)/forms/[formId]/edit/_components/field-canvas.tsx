"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { LayoutGrid } from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import { FieldCard } from "./field-card";

export function FieldCanvas() {
  const { fields, reorderFields } = useFormEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    reorderFields(reordered.map((f) => f.id));
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#080808]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06]">
              <LayoutGrid className="size-5 text-[#6B6B6B]" />
            </div>
            <p className="text-sm text-[#6B6B6B]">
              Add a field from the left to get started
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2.5">
                {fields.map((field, i) => (
                  <FieldCard key={field.id} field={field} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Canvas
        </span>
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        {fields.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-dashed border-border">
              <LayoutGrid className="size-5 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">No fields yet</p>
              <p className="text-xs text-muted-foreground/60">
                Add fields from the palette on the left
              </p>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {fields.map((field) => (
                  <FieldCard key={field.id} field={field} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

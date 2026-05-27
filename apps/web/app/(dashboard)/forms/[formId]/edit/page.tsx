"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Monitor } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { useFormEditorStore } from "~/stores/form-editor";
import { EditorTopbar } from "./_components/editor-topbar";
import { FieldPalette, FIELD_GROUPS } from "./_components/field-palette";
import { FieldCanvas } from "./_components/field-canvas";
import { PropertyPanel } from "./_components/property-panel";

export default function EditorPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const { setForm, fields, addField, reorderFields } = useFormEditorStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id.toString());
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const isPalette = active.id.toString().startsWith("palette::");
    if (isPalette) {
      if (!over) return;
      const type = active.id.toString().replace("palette::", "");
      const item = FIELD_GROUPS.flatMap((g) => g.types).find((t) => t.type === type);
      if (!item) return;
      addField({
        id: nanoid(),
        order: fields.length,
        type,
        label: "",
        required: false,
        config: item.defaultConfig as Record<string, unknown>,
      });
    } else {
      if (!over || active.id === over.id) return;
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      reorderFields(arrayMove(fields, oldIndex, newIndex).map((f) => f.id));
    }
  }

  const formQuery = trpc.forms.get.useQuery({ formId });
  const draftQuery = trpc.forms.versions.getDraft.useQuery({ formId });

  useEffect(() => {
    if (!draftQuery.data) return;
    const d = draftQuery.data;
    setForm(
      {
        id: d.id,
        formId: d.formId,
        versionNumber: d.versionNumber,
        status: d.status,
        title: d.title,
        description: d.description,
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
        createdAt: new Date(d.createdAt),
      },
      d.fields.map((f) => ({
        id: f.id,
        order: f.order,
        type: f.type,
        label: f.label,
        required: f.required,
        config: f.config,
      })),
    );
  }, [draftQuery.data]);

  if (draftQuery.isPending || formQuery.isPending) {
    return (
      <div className="flex h-full flex-col bg-[#080808]">
        <div className="m-3 flex h-14 shrink-0 items-center rounded-2xl bg-white/2 px-5 ring-1 ring-white/6">
          <div className="h-4 w-40 animate-shimmer rounded-full bg-linear-to-r from-white/4 via-white/10 to-white/4 bg-size-[200%_100%]" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-[#6B6B6B]" />
        </div>
      </div>
    );
  }

  if (draftQuery.isError || formQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#080808]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/2 ring-1 ring-white/6">
          <AlertCircle className="size-5 text-[#E8854A]" />
        </div>
        <p className="text-sm text-[#6B6B6B]">Failed to load form</p>
      </div>
    );
  }

  const publicSlug = formQuery.data?.publicSlug ?? null;
  const visibility = formQuery.data?.visibility ?? "unlisted";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080808] p-3">
      {/* Desktop editor */}
      <div className="hidden h-full flex-col overflow-hidden lg:flex">
        <EditorTopbar formId={formId} publicSlug={publicSlug} visibility={visibility} />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="mt-3 flex flex-1 overflow-hidden rounded-2xl ring-1 ring-white/6">
            <FieldPalette />
            <FieldCanvas />
            <PropertyPanel />
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId?.startsWith("palette::")
              ? (() => {
                  const type = activeId.replace("palette::", "");
                  const item = FIELD_GROUPS.flatMap((g) => g.types).find((t) => t.type === type);
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <div className="flex w-49 items-center gap-2.5 rounded-full bg-[#1a1a1a] px-2.5 py-2 opacity-90 shadow-lg shadow-black/50 ring-1 ring-[#E8854A]/40">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8854A]/10 text-[#E8854A] ring-1 ring-[#E8854A]/30">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="font-mono text-[12px] text-[#F2F2F2]">{item.label}</span>
                    </div>
                  );
                })()
              : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile / tablet fallback */}
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center lg:hidden">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/2 ring-1 ring-white/6">
          <Monitor className="size-6 text-[#6B6B6B]" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold tracking-tight text-[#F2F2F2]">
            Desktop browser required
          </p>
          <p className="text-sm text-[#6B6B6B]">
            The form editor isn&apos;t supported on small screens.
          </p>
        </div>
        <Button
          variant="link"
          asChild
          className="text-sm text-[#E8854A] underline-offset-4 hover:underline"
        >
          <Link href="/forms">Back to forms</Link>
        </Button>
      </div>
    </div>
  );
}

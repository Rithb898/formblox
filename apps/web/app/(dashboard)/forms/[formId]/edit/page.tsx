"use client";

import { useEffect } from "react";
import { use } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useFormEditorStore } from "~/stores/form-editor";
import { EditorTopbar } from "./_components/editor-topbar";
import { FieldPalette } from "./_components/field-palette";
import { FieldCanvas } from "./_components/field-canvas";
import { PropertyPanel } from "./_components/property-panel";

export default function EditorPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const { setForm } = useFormEditorStore();

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
      <div className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (draftQuery.isError || formQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load form</p>
      </div>
    );
  }

  const publicSlug = formQuery.data?.publicSlug ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorTopbar formId={formId} publicSlug={publicSlug} />
      <div className="flex flex-1 overflow-hidden">
        <FieldPalette />
        <FieldCanvas />
        <PropertyPanel />
      </div>
    </div>
  );
}

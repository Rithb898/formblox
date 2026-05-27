"use client";

import { useEffect } from "react";
import { use } from "react";
import { Loader2, AlertCircle, Monitor } from "lucide-react";
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
      <div className="flex h-full flex-col bg-[#080808]">
        <div className="m-3 flex h-14 shrink-0 items-center rounded-2xl bg-white/[0.02] px-5 ring-1 ring-white/[0.06]">
          <div className="h-4 w-40 animate-shimmer rounded-full bg-gradient-to-r from-white/[0.04] via-white/[0.10] to-white/[0.04] bg-[length:200%_100%]" />
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
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06]">
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
        <div className="mt-3 flex flex-1 overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
          <FieldPalette />
          <FieldCanvas />
          <PropertyPanel />
        </div>
      </div>

      {/* Mobile / tablet fallback */}
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center lg:hidden">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06]">
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
        <a
          href="/forms"
          className="text-sm text-[#E8854A] underline-offset-4 hover:underline"
        >
          Back to forms
        </a>
      </div>
    </div>
  );
}

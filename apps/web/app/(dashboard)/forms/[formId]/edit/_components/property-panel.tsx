"use client";

import { MousePointer2 } from "lucide-react";
import { useFormEditorStore } from "~/stores/form-editor";
import { ShortTextPanel } from "./panels/short-text-panel";
import { LongTextPanel } from "./panels/long-text-panel";

export function PropertyPanel() {
  const { fields, selectedFieldId } = useFormEditorStore();
  const field = fields.find((f) => f.id === selectedFieldId);

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Properties
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!field ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-border">
              <MousePointer2 className="size-4 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Select a field to edit its properties
            </p>
          </div>
        ) : field.type === "short_text" ? (
          <ShortTextPanel field={field} />
        ) : field.type === "long_text" ? (
          <LongTextPanel field={field} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Properties for <span className="font-medium text-foreground">{field.type}</span>
            </p>
            <p className="text-xs text-muted-foreground/60">Coming in Slice 3</p>
          </div>
        )}
      </div>
    </aside>
  );
}

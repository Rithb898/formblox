"use client";

import { use } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Inbox, Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "~/trpc/client";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "~/components/ui/table";

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const q = trpc.forms.responses.list.useQuery({ formId });

  // Build ordered union of columns from all responses
  const columns: { fieldId: string; label: string }[] = [];
  const seenFieldIds = new Set<string>();
  for (const response of q.data ?? []) {
    for (const answer of response.answers) {
      if (!seenFieldIds.has(answer.fieldId)) {
        seenFieldIds.add(answer.fieldId);
        columns.push({ fieldId: answer.fieldId, label: answer.label });
      }
    }
  }

  const responses = q.data ?? [];
  const count = responses.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/forms/${formId}/edit`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to editor
          </Link>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <h1 className="text-sm font-semibold text-foreground">Responses</h1>
          {!q.isPending && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {q.isPending ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : responses.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-border">
              <Inbox className="size-6 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No responses yet</p>
              <p className="text-xs text-muted-foreground">Responses will appear here once people submit your form</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.fieldId} className="whitespace-nowrap">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => {
                  const answerMap = new Map(response.answers.map((a) => [a.fieldId, a.value]));
                  return (
                    <TableRow key={response.id}>
                      {columns.map((col) => (
                        <TableCell key={col.fieldId} className="whitespace-nowrap text-sm text-foreground">
                          {answerMap.has(col.fieldId)
                            ? renderValue(answerMap.get(col.fieldId))
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      ))}
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {response.completedAt
                          ? formatDistanceToNow(new Date(response.completedAt), { addSuffix: true })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

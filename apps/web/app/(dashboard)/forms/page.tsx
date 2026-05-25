"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, LayoutGrid, MoreHorizontal, Pencil, Trash2,
  RotateCcw, Loader2, Globe, FileText, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";

type FormListItem = {
  id: string;
  publicSlug: string;
  isAcceptingResponses: boolean;
  createdAt: Date;
  title: string;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "published"
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-muted text-muted-foreground",
      )}
    >
      {status === "published" ? (
        <Globe className="mr-1 size-2.5" />
      ) : (
        <FileText className="mr-1 size-2.5" />
      )}
      {status}
    </span>
  );
}

function DeleteDialog({
  form,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  form: FormListItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete form?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{form?.title || "Untitled form"}</span> will
            be soft-deleted. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormCard({
  form,
  onDelete,
  onRestore,
}: {
  form: FormListItem;
  onDelete: (form: FormListItem) => void;
  onRestore: (id: string) => void;
}) {
  const router = useRouter();
  const isDeleted = false; // soft-deleted forms are filtered out by the list query

  return (
    <div
      onClick={() => router.push(`/forms/${form.id}/edit`)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all",
        "hover:border-border/80 hover:shadow-sm",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {form.title || "Untitled form"}
          </h3>
          <StatusBadge status={form.status} />
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/edit`)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/responses`)}>
              <Inbox className="size-4" />
              Responses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(form)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground">
        Created {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}
      </p>
    </div>
  );
}

function EmptyState({ onNew, isPending }: { onNew: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-border">
        <LayoutGrid className="size-6 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No forms yet</p>
        <p className="text-xs text-muted-foreground">Create your first form to get started</p>
      </div>
      <Button onClick={onNew} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create your first form
      </Button>
    </div>
  );
}

export default function FormsPage() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);

  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspaceId = workspacesQuery.data?.[0]?.id;

  const formsQuery = trpc.forms.list.useQuery(
    { workspaceId: workspaceId! },
    { enabled: !!workspaceId },
  );

  const createMutation = trpc.forms.create.useMutation({
    onSuccess: (form) => router.push(`/forms/${form.id}/edit`),
    onError: () => toast.error("Failed to create form"),
  });

  const deleteMutation = trpc.forms.softDelete.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      setDeleteTarget(null);
      toast.success("Form deleted");
    },
    onError: () => toast.error("Failed to delete form"),
  });

  const restoreMutation = trpc.forms.restore.useMutation({
    onSuccess: () => {
      formsQuery.refetch();
      toast.success("Form restored");
    },
    onError: () => toast.error("Failed to restore form"),
  });

  function handleNew() {
    if (!workspaceId) return;
    createMutation.mutate({ workspaceId, title: "Untitled form" });
  }

  const forms = formsQuery.data ?? [];
  const isLoading = workspacesQuery.isPending || formsQuery.isPending;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Page header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <h1 className="text-sm font-semibold text-foreground">Forms</h1>
        <Button
          size="sm"
          onClick={handleNew}
          disabled={createMutation.isPending || !workspaceId}
          className="gap-1.5"
        >
          {createMutation.isPending
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Plus className="size-3.5" />}
          New form
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <EmptyState onNew={handleNew} isPending={createMutation.isPending} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                form={{ ...form, createdAt: new Date(form.createdAt) }}
                onDelete={setDeleteTarget}
                onRestore={(id) => restoreMutation.mutate({ formId: id })}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteDialog
        form={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ formId: deleteTarget.id })}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

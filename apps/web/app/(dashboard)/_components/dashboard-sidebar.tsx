"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  LogOut,
  Loader2,
  Compass,
  CreditCard,
  HelpCircle,
  Settings,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { useAuthStore } from "~/stores/auth";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Sidebar,
  SidebarContent as CossSidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "~/components/ui/sidebar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="text-zinc-500 hover:text-zinc-200 hover:bg-white/6"
        >
          {copied ? <Check className="size-3 text-[#E8854A]" /> : <Copy className="size-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy ID"}</TooltipContent>
    </Tooltip>
  );
}

function DashboardSidebarContent() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspace = workspacesQuery.data?.[0];
  const utils = trpc.useUtils();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const updateWorkspace = trpc.workspaces.update.useMutation({
    onSuccess: (updated) => {
      utils.workspaces.listMine.invalidate();
      setWorkspaceName(updated.name);
      setWorkspaceOpen(false);
      toast.success("Workspace name updated");
    },
    onError: () => toast.error("Failed to update workspace"),
  });

  useEffect(() => {
    if (workspace?.name) {
      setWorkspaceName(workspace.name);
    }
  }, [workspace?.name]);

  const isDirty = workspaceName.trim() !== (workspace?.name ?? "");

  const navItems = [
    { href: "/forms", label: "Forms", icon: LayoutGrid },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/billing", label: "Plan & Billing", icon: CreditCard },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <>
      {/* Header */}
      <SidebarHeader className="p-0">
        {/* Wordmark logo */}
        <div className="flex h-14 items-center border-b border-zinc-900/60 px-5 shrink-0">
          <Image
            src="/logo.png"
            alt="FormBlox"
            width={100}
            height={25}
            className="object-contain"
          />
        </div>

        {/* Workspace selector */}
        <div className="flex h-14 items-center border-b border-zinc-900/60 px-4 shrink-0">
          {workspacesQuery.isPending ? (
            <div className="flex items-center gap-2 px-2">
              <Loader2 className="size-3.5 animate-spin text-zinc-500" />
              <span className="font-mono text-xs text-zinc-500">Loading…</span>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => setWorkspaceOpen(true)}
                  className="group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left hover:border-zinc-800/40 hover:bg-zinc-900/60 h-auto"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-[#E8854A] to-[#ffaa77] text-[11px] font-bold text-[#0a0a0a] shadow-sm">
                      {(workspaceName || workspace?.name)?.[0]?.toUpperCase() ?? "W"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                        Workspace
                      </span>
                      <span className="truncate text-sm font-semibold tracking-tight text-zinc-200 mt-1 leading-none">
                        {workspaceName || (workspace?.name ?? "Workspace")}
                      </span>
                    </div>
                  </div>
                  <Settings className="size-4 shrink-0 text-zinc-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-90 group-hover:text-zinc-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Workspace settings</TooltipContent>
            </Tooltip>
          )}
        </div>
      </SidebarHeader>

      {/* Content scroll area */}
      <CossSidebarContent className="p-3 gap-1 overflow-y-auto">
        <SidebarMenu className="gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            const content = (
              <>
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-[#E8854A] shadow-[0_0_12px_rgba(232,133,74,0.6)]" />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5",
                    active ? "text-[#E8854A]" : "text-zinc-400 group-hover:text-zinc-200",
                  )}
                />
                <span className="truncate">{label}</span>
              </>
            );

            const itemClassName = cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100 border border-transparent hover:border-zinc-800/30 cursor-pointer",
              active &&
                "bg-[#E8854A]/8 border-[#E8854A]/15 font-semibold text-[#E8854A] hover:bg-[#E8854A]/10 hover:text-[#E8854A] hover:border-[#E8854A]/20",
            );

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton render={<Link href={href} />} className={itemClassName}>
                  {content}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </CossSidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 bg-linear-to-t from-[#080808] to-transparent shrink-0">
        {user && (
          <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-2 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-800/80 hover:bg-zinc-900/40">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1 py-0.5 text-sm">
                <Avatar className="size-8 shrink-0 ring-1 ring-zinc-800">
                  <AvatarFallback className="bg-linear-to-tr from-zinc-800 to-zinc-700 text-xs font-semibold text-zinc-200">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-xs font-semibold leading-tight text-zinc-200">
                    {user.fullName}
                  </span>
                  <span className="truncate font-mono text-[9px] leading-tight text-zinc-500 mt-0.5">
                    {user.email}
                  </span>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Sign out"
                    onClick={logout}
                    className="shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </SidebarFooter>

      {/* Workspace Settings Dialog */}
      <Dialog
        open={workspaceOpen}
        onOpenChange={(v) => {
          if (!updateWorkspace.isPending) {
            setWorkspaceOpen(v);
            if (!v) setWorkspaceName(workspace?.name ?? "");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm bg-zinc-950 border-zinc-800/60 text-zinc-100 p-0 overflow-hidden gap-0">
          {/* Dialog header band */}
          <div className="relative flex items-center gap-4 px-6 pt-6 pb-5 border-b border-zinc-800/60">
            {/* Accent glow */}
            <div className="absolute inset-0 bg-linear-to-br from-[#E8854A]/6 to-transparent pointer-events-none" />
            <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-[#E8854A] to-[#ffaa77] text-lg font-bold text-[#0a0a0a] shadow-lg shadow-[#E8854A]/20">
              {(workspaceName || workspace?.name)?.[0]?.toUpperCase() ?? "W"}
            </div>
            <div className="relative min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold tracking-tight text-zinc-100">
                Workspace Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                Manage your workspace name and details.
              </DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {/* Name field */}
            <div className="space-y-2">
              <label
                htmlFor="wName"
                className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest"
              >
                Workspace Name
              </label>
              <Input
                id="wName"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isDirty && !updateWorkspace.isPending) {
                    updateWorkspace.mutate({
                      workspaceId: workspace!.id,
                      name: workspaceName.trim(),
                    });
                  }
                }}
                placeholder="Enter workspace name"
                className="bg-zinc-900 border-zinc-700/60 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-[#E8854A]/50 focus-visible:ring-[#E8854A]/20"
              />
            </div>

            {/* Info rows */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Workspace ID
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-zinc-400 truncate max-w-35">
                    {workspace?.id ?? "—"}
                  </span>
                  {workspace?.id && <CopyButton value={workspace.id} />}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Created
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {workspace?.createdAt
                    ? new Date(workspace.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/30 gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700/60 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 text-xs"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={!isDirty || updateWorkspace.isPending || !workspaceName.trim()}
              onClick={() =>
                updateWorkspace.mutate({ workspaceId: workspace!.id, name: workspaceName.trim() })
              }
              className="bg-[#E8854A] hover:bg-[#E8854A]/90 text-xs font-semibold text-[#0a0a0a] disabled:opacity-40 transition-all duration-300 min-w-25"
            >
              {updateWorkspace.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const isEditor = /^\/forms\/[^/]+\/edit/.test(pathname);

  if (isEditor) return null;

  return (
    <Sidebar className="border-r border-zinc-900 bg-[#080808] text-zinc-400">
      <DashboardSidebarContent />
    </Sidebar>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const isEditor = /^\/forms\/[^/]+\/edit/.test(pathname);

  if (isEditor) return null;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-900 bg-[#080808] px-4 md:hidden">
      <Image src="/logo.png" alt="FormBlox" width={100} height={25} className="object-contain" />
      <SidebarTrigger className="text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200" />
    </div>
  );
}

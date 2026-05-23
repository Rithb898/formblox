"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, LogOut, ChevronsUpDown, Loader2 } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useAuthStore } from "~/stores/auth";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspace = workspacesQuery.data?.[0];

  const navItems = [
    { href: "/forms", label: "Forms", icon: LayoutGrid },
  ];

  return (
    <aside className="flex h-screen w-55 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Workspace header */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {workspacesQuery.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading…</span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              {workspace?.name?.[0]?.toUpperCase() ?? "W"}
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {workspace?.name ?? "Workspace"}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent">
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-xs">{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-xs font-medium leading-tight text-foreground">{user.fullName}</span>
                  <span className="truncate text-[10px] leading-tight text-muted-foreground">{user.email}</span>
                </div>
                <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, LogOut, ChevronsUpDown, Loader2, Menu } from "lucide-react";
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
import { Sheet, SheetTrigger, SheetContent } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SidebarContent() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const workspacesQuery = trpc.workspaces.listMine.useQuery(undefined);
  const workspace = workspacesQuery.data?.[0];

  const navItems = [{ href: "/forms", label: "Forms", icon: LayoutGrid }];

  return (
    <>
      {/* Wordmark */}
      <div className="flex h-14 items-center border-b border-white/[0.07] px-4">
        <Image src="/logo.png" alt="FormBlox" width={100} height={25} className="object-contain" />
      </div>

      {/* Workspace header */}
      <div className="flex h-14 items-center border-b border-white/[0.07] px-4">
        {workspacesQuery.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-[#6B6B6B]" />
            <span className="font-mono text-xs text-[#6B6B6B]">Loading…</span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#E8854A] text-[10px] font-bold text-[#0a0a0a]">
              {workspace?.name?.[0]?.toUpperCase() ?? "W"}
            </div>
            <span className="truncate text-sm font-medium tracking-tight text-[#F2F2F2]">
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
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "bg-[#E8854A]/12 font-medium text-[#E8854A]"
                  : "text-[#6B6B6B] hover:bg-white/4 hover:text-[#F2F2F2]",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#E8854A]" />
              )}
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-white/[0.07] p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/4">
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-white/6 text-xs text-[#F2F2F2]">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-xs font-medium leading-tight text-[#F2F2F2]">
                    {user.fullName}
                  </span>
                  <span className="truncate font-mono text-[10px] leading-tight text-[#6B6B6B]">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="size-3.5 shrink-0 text-[#3A3A3A]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={logout}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="flex h-screen w-55 shrink-0 flex-col border-r border-white/[0.07] bg-[#0d0d0d]">
      <SidebarContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0d0d0d] px-4 lg:hidden">
      <Image src="/logo.png" alt="FormBlox" width={100} height={25} className="object-contain" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#6B6B6B] hover:bg-white/6 hover:text-[#F2F2F2]"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-55 border-r border-white/[0.07] bg-[#0d0d0d] p-0">
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

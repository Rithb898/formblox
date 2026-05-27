import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { DashboardSidebar, MobileNav } from "./_components/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await api.auth.me.query({});
  } catch {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-y-auto bg-[#080808]">
        <MobileNav />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

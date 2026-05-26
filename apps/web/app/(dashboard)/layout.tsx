import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { DashboardSidebar, MobileNav } from "./_components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await api.auth.me.query({});
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808]">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      <main className="flex flex-1 flex-col overflow-y-auto">
        <MobileNav />
        {children}
      </main>
    </div>
  );
}

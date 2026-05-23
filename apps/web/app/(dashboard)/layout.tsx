import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await api.auth.me.query({});
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

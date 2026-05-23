"use client";

import { useAuthStore } from "~/stores/auth";
import { Button } from "~/components/ui/button";

export default function DashboardPage() {
  const { user, isLoading, logout, logoutAll } = useAuthStore();

  if (isLoading) return <p className="p-8">Loading...</p>;

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user && (
        <div className="space-y-1">
          <p>Welcome, {user.fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
        <Button variant="destructive" onClick={logoutAll}>
          Sign out all devices
        </Button>
      </div>
    </main>
  );
}

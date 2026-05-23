"use client";

import { useAuthStore } from "~/stores/auth";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { user, isLoading, logout, logoutAll } = useAuthStore();

  if (isLoading) return <p className="p-8">Loading...</p>;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <CardTitle>{user.fullName}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
                <Button variant="destructive" onClick={logoutAll}>
                  Sign out all devices
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export default async function Home() {
  try {
    await api.auth.me.query({});
    redirect("/forms");
  } catch {
    redirect("/login");
  }
}

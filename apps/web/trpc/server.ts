import type { ServerRouter } from "@repo/trpc/client";
import { createTRPCProxyClient } from "@repo/trpc/client";
import { cookies } from "next/headers";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

async function serverHeaders() {
  const cookieStore = await cookies();
  return { cookie: cookieStore.toString() };
}

export const api = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient({ headers: serverHeaders })],
});

export const apiStreaming = createTRPCProxyClient<ServerRouter>({
  links: [createTRPCHttpBatchClientClient({ enableStreaming: true, headers: serverHeaders })],
});

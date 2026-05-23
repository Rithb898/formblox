import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { z } from "zod";
import { eq, and } from "@repo/database";
import { workspaceMembersTable, formsTable } from "@repo/database/schema";
import db from "@repo/database";

import { createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// kept for backward compat with auth routes
export const protectedProcedure = authedProcedure;

export const workspaceProcedure = authedProcedure
  .input(z.object({ workspaceId: z.string().uuid() }))
  .use(async ({ ctx, input, next }) => {
    const [member] = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, input.workspaceId),
          eq(workspaceMembersTable.userId, ctx.userId),
        ),
      )
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, workspace: { id: input.workspaceId } } });
  });

export const formProcedure = authedProcedure
  .input(z.object({ formId: z.string().uuid() }))
  .use(async ({ ctx, input, next }) => {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, input.formId))
      .limit(1);
    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    const [member] = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, form.workspaceId),
          eq(workspaceMembersTable.userId, ctx.userId),
        ),
      )
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, form } });
  });

import { eq } from "@repo/database";
import { workspaceMembersTable, workspacesTable } from "@repo/database/schema";
import db from "@repo/database";
import { withCache, invalidateKeys, CacheKeys } from "@repo/services/redis";
import { z } from "../../schema";
import { authedProcedure, workspaceProcedure, router } from "../../trpc";
import { zodUndefinedModel } from "../../schema";

const workspaceOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

const TAGS = ["Workspaces"];

export const workspacesRouter = router({
  listMine: authedProcedure
    .meta({ openapi: { method: "GET", path: "/workspaces", tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(workspaceOutputSchema))
    .query(async ({ ctx }) => {
      return withCache(CacheKeys.userWorkspaces(ctx.userId), 600, async () => {
        const rows = await db
          .select({
            id: workspacesTable.id,
            name: workspacesTable.name,
            createdAt: workspacesTable.createdAt,
          })
          .from(workspaceMembersTable)
          .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
          .where(eq(workspaceMembersTable.userId, ctx.userId));
        return rows;
      });
    }),

  get: workspaceProcedure
    .meta({ openapi: { method: "GET", path: "/workspaces/{workspaceId}", tags: TAGS } })
    .input(z.object({ workspaceId: z.string().uuid() }))
    .output(workspaceOutputSchema)
    .query(async ({ ctx }) => {
      const [workspace] = await db
        .select({
          id: workspacesTable.id,
          name: workspacesTable.name,
          createdAt: workspacesTable.createdAt,
        })
        .from(workspacesTable)
        .where(eq(workspacesTable.id, ctx.workspace.id))
        .limit(1);
      return workspace!;
    }),

  update: workspaceProcedure
    .meta({ openapi: { method: "PATCH", path: "/workspaces/{workspaceId}", tags: TAGS } })
    .input(z.object({ workspaceId: z.string().uuid(), name: z.string().min(1).max(100) }))
    .output(workspaceOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated, members] = await Promise.all([
        db
          .update(workspacesTable)
          .set({ name: input.name })
          .where(eq(workspacesTable.id, ctx.workspace.id))
          .returning({
            id: workspacesTable.id,
            name: workspacesTable.name,
            createdAt: workspacesTable.createdAt,
          })
          .then((rows) => rows[0]!),
        db
          .select({ userId: workspaceMembersTable.userId })
          .from(workspaceMembersTable)
          .where(eq(workspaceMembersTable.workspaceId, ctx.workspace.id)),
      ]);
      await invalidateKeys(...members.map((m) => CacheKeys.userWorkspaces(m.userId)));
      return updated;
    }),
});

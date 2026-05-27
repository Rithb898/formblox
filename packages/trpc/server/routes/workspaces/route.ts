import { eq } from "@repo/database";
import { workspaceMembersTable, workspacesTable } from "@repo/database/schema";
import db from "@repo/database";
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
});

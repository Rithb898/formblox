import { eq, desc } from "@repo/database";
import { formsTable, formVersionsTable } from "@repo/database/schema";
import db from "@repo/database";
import { nanoid } from "nanoid";
import { z } from "../../schema";
import { workspaceProcedure, formProcedure } from "../../trpc";
import { formWithVersionSchema, formListItemSchema } from "./model";

const TAGS = ["Forms"];

export const create = workspaceProcedure
  .meta({ openapi: { method: "POST", path: "/workspaces/{workspaceId}/forms", tags: TAGS } })
  .input(z.object({ workspaceId: z.string(), title: z.string().default("Untitled form") }))
  .output(formWithVersionSchema)
  .mutation(async ({ ctx, input }) => {
    return await db.transaction(async (tx) => {
      const [form] = await tx
        .insert(formsTable)
        .values({ workspaceId: ctx.workspace.id, publicSlug: nanoid(10) })
        .returning();

      const [version] = await tx
        .insert(formVersionsTable)
        .values({ formId: form!.id, versionNumber: 1, status: "draft", title: input.title })
        .returning();

      return { ...form!, version: version! };
    });
  });

export const list = workspaceProcedure
  .meta({ openapi: { method: "GET", path: "/workspaces/{workspaceId}/forms", tags: TAGS } })
  .input(z.object({ workspaceId: z.string() }))
  .output(z.array(formListItemSchema))
  .query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: formsTable.id,
        publicSlug: formsTable.publicSlug,
        isAcceptingResponses: formsTable.isAcceptingResponses,
        createdAt: formsTable.createdAt,
        title: formVersionsTable.title,
        status: formVersionsTable.status,
      })
      .from(formsTable)
      .innerJoin(formVersionsTable, eq(formVersionsTable.formId, formsTable.id))
      .where(eq(formsTable.workspaceId, ctx.workspace.id))
      .orderBy(desc(formsTable.createdAt));

    const byForm = new Map<string, (typeof rows)[0]>();
    for (const row of rows) {
      const existing = byForm.get(row.id);
      if (!existing || row.status === "published") byForm.set(row.id, row);
    }
    return [...byForm.values()];
  });

export const get = formProcedure
  .meta({ openapi: { method: "GET", path: "/forms/{formId}", tags: TAGS } })
  .input(z.object({ formId: z.string() }))
  .output(formWithVersionSchema)
  .query(async ({ ctx }) => {
    const [version] = await db
      .select()
      .from(formVersionsTable)
      .where(eq(formVersionsTable.formId, ctx.form.id))
      .orderBy(desc(formVersionsTable.versionNumber))
      .limit(1);

    return { ...ctx.form, version: version! };
  });

export const setVisibility = formProcedure
  .meta({ openapi: { method: "PATCH", path: "/forms/{formId}/visibility", tags: TAGS } })
  .input(z.object({ formId: z.string(), visibility: z.enum(["public", "unlisted"]) }))
  .output(z.void())
  .mutation(async ({ ctx, input }) => {
    await db.update(formsTable).set({ visibility: input.visibility }).where(eq(formsTable.id, ctx.form.id));
  });

export const softDelete = formProcedure
  .meta({ openapi: { method: "DELETE", path: "/forms/{formId}", tags: TAGS } })
  .input(z.object({ formId: z.string() }))
  .output(z.void())
  .mutation(async ({ ctx }) => {
    await db.update(formsTable).set({ deletedAt: new Date() }).where(eq(formsTable.id, ctx.form.id));
  });

export const restore = formProcedure
  .meta({ openapi: { method: "POST", path: "/forms/{formId}/restore", tags: TAGS } })
  .input(z.object({ formId: z.string() }))
  .output(z.void())
  .mutation(async ({ ctx }) => {
    await db.update(formsTable).set({ deletedAt: null }).where(eq(formsTable.id, ctx.form.id));
  });

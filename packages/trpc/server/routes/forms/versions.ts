import { eq, asc, and, inArray, sql } from "@repo/database";
import { formVersionsTable, formFieldsTable } from "@repo/database/schema";
import db from "@repo/database";
import { TRPCError } from "@trpc/server";
import { z } from "../../schema";
import { formProcedure, router } from "../../trpc";
import { fieldInputSchema, versionWithFieldsSchema } from "./model";

type FieldType = "short_text" | "long_text" | "email" | "number" | "single_choice" | "multiple_choice" | "rating" | "date";

function mapField(f: { id: string; order: number; type: string; label: string; required: boolean; config: unknown }) {
  return { id: f.id, order: f.order, type: f.type, label: f.label, required: f.required, config: (f.config ?? {}) as Record<string, unknown> };
}

async function getDraftWithFields(formId: string) {
  const [draft] = await db
    .select()
    .from(formVersionsTable)
    .where(and(eq(formVersionsTable.formId, formId), eq(formVersionsTable.status, "draft")))
    .limit(1);
  if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "No draft version" });

  const fields = await db
    .select()
    .from(formFieldsTable)
    .where(eq(formFieldsTable.formVersionId, draft.id))
    .orderBy(asc(formFieldsTable.order));

  return { ...draft, fields: fields.map(mapField) };
}

export const formsVersionsRouter = router({
  getDraft: formProcedure
    .input(z.object({ formId: z.string() }))
    .output(versionWithFieldsSchema)
    .query(async ({ ctx }) => getDraftWithFields(ctx.form.id)),

  updateDraft: formProcedure
    .input(z.object({
      formId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      fields: z.array(fieldInputSchema),
    }))
    .output(versionWithFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      return await db.transaction(async (tx) => {
        const [draft] = await tx
          .select()
          .from(formVersionsTable)
          .where(and(eq(formVersionsTable.formId, ctx.form.id), eq(formVersionsTable.status, "draft")))
          .limit(1);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "No draft version" });

        if (input.title !== undefined || input.description !== undefined) {
          await tx.update(formVersionsTable).set({
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
          }).where(eq(formVersionsTable.id, draft.id));
        }

        const existingFields = await tx
          .select({ id: formFieldsTable.id })
          .from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, draft.id));

        const incomingIds = input.fields.map((f) => f.id);
        const toDelete = existingFields.map((f) => f.id).filter((id) => !incomingIds.includes(id));

        if (toDelete.length > 0) {
          await tx.delete(formFieldsTable).where(inArray(formFieldsTable.id, toDelete));
        }

        for (const field of input.fields) {
          await tx.insert(formFieldsTable)
            .values({
              id: field.id,
              formVersionId: draft.id,
              order: field.order,
              type: field.type as FieldType,
              label: field.label,
              required: field.required,
              config: field.config,
            })
            .onConflictDoUpdate({
              target: formFieldsTable.id,
              set: { order: field.order, label: field.label, required: field.required, config: field.config, updatedAt: sql`now()` },
            });
        }

        const updatedFields = await tx.select().from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, draft.id))
          .orderBy(asc(formFieldsTable.order));

        const [updatedVersion] = await tx.select().from(formVersionsTable)
          .where(eq(formVersionsTable.id, draft.id)).limit(1);

        return { ...updatedVersion!, fields: updatedFields.map(mapField) };
      });
    }),

  publish: formProcedure
    .input(z.object({ formId: z.string() }))
    .output(z.object({ publishedVersionId: z.string(), newDraftVersionId: z.string() }))
    .mutation(async ({ ctx }) => {
      return await db.transaction(async (tx) => {
        const [draft] = await tx
          .select()
          .from(formVersionsTable)
          .where(and(eq(formVersionsTable.formId, ctx.form.id), eq(formVersionsTable.status, "draft")))
          .limit(1);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "No draft version" });

        await tx.update(formVersionsTable).set({ status: "archived" })
          .where(and(eq(formVersionsTable.formId, ctx.form.id), eq(formVersionsTable.status, "published")));

        const [published] = await tx.update(formVersionsTable)
          .set({ status: "published", publishedAt: new Date() })
          .where(eq(formVersionsTable.id, draft.id))
          .returning();

        const fields = await tx.select().from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, draft.id))
          .orderBy(asc(formFieldsTable.order));

        const [newDraft] = await tx.insert(formVersionsTable).values({
          formId: ctx.form.id,
          versionNumber: draft.versionNumber + 1,
          status: "draft",
          title: draft.title,
          description: draft.description,
          settings: draft.settings,
        }).returning();

        if (fields.length > 0) {
          await tx.insert(formFieldsTable).values(
            fields.map((f) => ({
              formVersionId: newDraft!.id,
              order: f.order,
              type: f.type,
              label: f.label,
              required: f.required,
              config: (f.config ?? {}) as Record<string, unknown>,
            })),
          );
        }

        return { publishedVersionId: published!.id, newDraftVersionId: newDraft!.id };
      });
    }),

  list: formProcedure
    .input(z.object({ formId: z.string() }))
    .output(z.array(z.object({
      id: z.string(),
      versionNumber: z.number(),
      status: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      publishedAt: z.date().nullable(),
      createdAt: z.date(),
    })))
    .query(async ({ ctx }) => {
      return await db.select({
        id: formVersionsTable.id,
        versionNumber: formVersionsTable.versionNumber,
        status: formVersionsTable.status,
        title: formVersionsTable.title,
        description: formVersionsTable.description,
        publishedAt: formVersionsTable.publishedAt,
        createdAt: formVersionsTable.createdAt,
      }).from(formVersionsTable)
        .where(eq(formVersionsTable.formId, ctx.form.id))
        .orderBy(asc(formVersionsTable.versionNumber));
    }),
});

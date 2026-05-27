import { nanoid } from "nanoid";
import { eq, asc, and } from "@repo/database";
import { formVersionsTable, formFieldsTable } from "@repo/database/schema";
import db from "@repo/database";
import { TRPCError } from "@trpc/server";
import { fieldConfigUnion, themeSchema } from "@repo/forms";
import { invalidateKeys, CacheKeys } from "@repo/services/redis";
import { z } from "../../schema";
import { formProcedure, router } from "../../trpc";
import { fieldInputSchema, versionWithFieldsSchema } from "./model";

function mapField(f: {
  id: string;
  order: number;
  type: string;
  label: string;
  required: boolean;
  config: unknown;
}) {
  return {
    id: f.id,
    order: f.order,
    type: f.type as
      | "number"
      | "date"
      | "email"
      | "short_text"
      | "long_text"
      | "single_choice"
      | "multiple_choice"
      | "rating",
    label: f.label,
    required: f.required,
    config: (f.config ?? {}) as Record<string, unknown>,
  };
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

  return { ...draft, theme: themeSchema.nullable().safeParse(draft.theme).data ?? null, fields: fields.map(mapField) };
}

const TAGS = ["Form Versions"];

export const formsVersionsRouter = router({
  getDraft: formProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{formId}/draft", tags: TAGS } })
    .input(z.object({ formId: z.string() }))
    .output(versionWithFieldsSchema)
    .query(async ({ ctx }) => getDraftWithFields(ctx.form.id)),

  updateDraft: formProcedure
    .meta({ openapi: { method: "PUT", path: "/forms/{formId}/draft", tags: TAGS } })
    .input(
      z.object({
        formId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        theme: themeSchema.nullable().optional(),
        fields: z.array(fieldInputSchema),
      }),
    )
    .output(versionWithFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      return await db.transaction(async (tx) => {
        const [draft] = await tx
          .select()
          .from(formVersionsTable)
          .where(
            and(eq(formVersionsTable.formId, ctx.form.id), eq(formVersionsTable.status, "draft")),
          )
          .limit(1);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "No draft version" });

        if (input.title !== undefined || input.description !== undefined || input.theme !== undefined) {
          await tx
            .update(formVersionsTable)
            .set({
              ...(input.title !== undefined ? { title: input.title } : {}),
              ...(input.description !== undefined ? { description: input.description } : {}),
              ...(input.theme !== undefined ? { theme: input.theme } : {}),
            })
            .where(eq(formVersionsTable.id, draft.id));
        }

        await tx.delete(formFieldsTable).where(eq(formFieldsTable.formVersionId, draft.id));

        if (input.fields.length > 0) {
          await tx.insert(formFieldsTable).values(
            input.fields.map((field) => ({
              id: field.id,
              formVersionId: draft.id,
              order: field.order,
              type: field.type,
              label: field.label,
              required: field.required,
              config: field.config,
            })),
          );
        }

        const updatedFields = await tx
          .select()
          .from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, draft.id))
          .orderBy(asc(formFieldsTable.order));

        const [updatedVersion] = await tx
          .select()
          .from(formVersionsTable)
          .where(eq(formVersionsTable.id, draft.id))
          .limit(1);

        return {
          ...updatedVersion!,
          theme: themeSchema.nullable().safeParse(updatedVersion!.theme).data ?? null,
          fields: updatedFields.map(mapField),
        };
      });
    }),

  publish: formProcedure
    .meta({ openapi: { method: "POST", path: "/forms/{formId}/publish", tags: TAGS } })
    .input(z.object({ formId: z.string() }))
    .output(z.object({ publishedVersionId: z.string(), newDraftVersionId: z.string() }))
    .mutation(async ({ ctx }) => {
      const result = await db.transaction(async (tx) => {
        const [draft] = await tx
          .select()
          .from(formVersionsTable)
          .where(
            and(eq(formVersionsTable.formId, ctx.form.id), eq(formVersionsTable.status, "draft")),
          )
          .limit(1);
        if (!draft) throw new TRPCError({ code: "NOT_FOUND", message: "No draft version" });

        // Fetch fields once — used for validation and new draft copy.
        const fields = await tx
          .select()
          .from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, draft.id))
          .orderBy(asc(formFieldsTable.order));

        // Guard: reject publish if title is blank.
        if (!draft.title?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: JSON.stringify({ code: "invalid_form", reason: "title_empty" }),
          });
        }

        // Guard: reject publish if any field has a blank label.
        const blankLabelIds = fields.filter((f) => !f.label?.trim()).map((f) => f.id);
        if (blankLabelIds.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: JSON.stringify({ code: "missing_labels", fieldIds: blankLabelIds }),
          });
        }

        // Guard: reject publish if any field has an invalid config (e.g. choice with < 2 options).
        const invalidFieldIds = fields
          .filter(
            (f) => !fieldConfigUnion.safeParse({ type: f.type, config: f.config ?? {} }).success,
          )
          .map((f) => f.id);
        if (invalidFieldIds.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: JSON.stringify({ code: "invalid_fields", fieldIds: invalidFieldIds }),
          });
        }

        await tx
          .update(formVersionsTable)
          .set({ status: "archived" })
          .where(
            and(
              eq(formVersionsTable.formId, ctx.form.id),
              eq(formVersionsTable.status, "published"),
            ),
          );

        const [published] = await tx
          .update(formVersionsTable)
          .set({ status: "published", publishedAt: new Date() })
          .where(eq(formVersionsTable.id, draft.id))
          .returning();

        const [newDraft] = await tx
          .insert(formVersionsTable)
          .values({
            formId: ctx.form.id,
            versionNumber: draft.versionNumber + 1,
            status: "draft",
            title: draft.title,
            description: draft.description,
            settings: draft.settings,
            theme: draft.theme,
          })
          .returning();

        if (fields.length > 0) {
          await tx.insert(formFieldsTable).values(
            fields.map((f) => ({
              id: nanoid(),
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

      await invalidateKeys(
        CacheKeys.formSlug(ctx.form.publicSlug),
        CacheKeys.formsPublicList(),
        CacheKeys.workspaceForms(ctx.form.workspaceId),
      );

      return result;
    }),

  list: formProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{formId}/versions", tags: TAGS } })
    .input(z.object({ formId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          versionNumber: z.number(),
          status: z.string(),
          title: z.string(),
          description: z.string().nullable(),
          publishedAt: z.date().nullable(),
          createdAt: z.date(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      return await db
        .select({
          id: formVersionsTable.id,
          versionNumber: formVersionsTable.versionNumber,
          status: formVersionsTable.status,
          title: formVersionsTable.title,
          description: formVersionsTable.description,
          publishedAt: formVersionsTable.publishedAt,
          createdAt: formVersionsTable.createdAt,
        })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, ctx.form.id))
        .orderBy(asc(formVersionsTable.versionNumber));
    }),
});

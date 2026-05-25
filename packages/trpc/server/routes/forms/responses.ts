import db, { eq, and, inArray, desc, asc, isNotNull } from "@repo/database";
import { responsesTable, responseAnswersTable, formFieldsTable, formVersionsTable } from "@repo/database/schema";
import { router, formProcedure } from "../../trpc";
import { responseListSchema } from "./model";

export const formsResponsesRouter = router({
  list: formProcedure
    .output(responseListSchema)
    .query(async ({ ctx }) => {
      // 1. all version ids for this form
      const versions = await db.select({ id: formVersionsTable.id })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, ctx.form.id));
      const versionIds = versions.map((v) => v.id);
      if (versionIds.length === 0) return [];

      // 2. completed responses across all versions, newest first
      const responses = await db.select({ id: responsesTable.id, completedAt: responsesTable.completedAt })
        .from(responsesTable)
        .where(and(inArray(responsesTable.formVersionId, versionIds), isNotNull(responsesTable.completedAt)))
        .orderBy(desc(responsesTable.completedAt));
      if (responses.length === 0) return [];

      // 3. answers joined to their field (label/type), ordered by field order
      const responseIds = responses.map((r) => r.id);
      const answers = await db.select({
        responseId: responseAnswersTable.responseId,
        fieldId: responseAnswersTable.fieldId,
        value: responseAnswersTable.value,
        label: formFieldsTable.label,
        type: formFieldsTable.type,
        order: formFieldsTable.order,
      })
        .from(responseAnswersTable)
        .innerJoin(formFieldsTable, eq(formFieldsTable.id, responseAnswersTable.fieldId))
        .where(inArray(responseAnswersTable.responseId, responseIds))
        .orderBy(asc(formFieldsTable.order));

      const byResponse = new Map<string, { fieldId: string; label: string; type: string; value: unknown }[]>();
      for (const a of answers) {
        const list = byResponse.get(a.responseId) ?? [];
        list.push({ fieldId: a.fieldId, label: a.label, type: a.type, value: a.value });
        byResponse.set(a.responseId, list);
      }

      return responses.map((r) => ({
        id: r.id,
        completedAt: r.completedAt,
        answers: byResponse.get(r.id) ?? [],
      }));
    }),
});

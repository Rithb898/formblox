import db, { eq, and, inArray, desc, asc, isNotNull } from "@repo/database";
import { responsesTable, responseAnswersTable, formFieldsTable, formVersionsTable, aiFollowupsTable } from "@repo/database/schema";
import { router, formProcedure } from "../../trpc";
import { responseListSchema, summaryDataSchema } from "./model";

export const formsResponsesRouter = router({
  summaryData: formProcedure
    .output(summaryDataSchema)
    .query(async ({ ctx }) => {
      const versions = await db
        .select({ id: formVersionsTable.id, title: formVersionsTable.title })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, ctx.form.id))
        .orderBy(desc(formVersionsTable.versionNumber));

      const formTitle = versions[0]?.title ?? "Untitled form";
      const versionIds = versions.map((v) => v.id);
      if (versionIds.length === 0) return { formTitle, responseCount: 0, fields: [] };

      const responses = await db
        .select({ id: responsesTable.id })
        .from(responsesTable)
        .where(and(inArray(responsesTable.formVersionId, versionIds), isNotNull(responsesTable.completedAt)));

      if (responses.length === 0) return { formTitle, responseCount: 0, fields: [] };

      const responseIds = responses.map((r) => r.id);

      const answers = await db
        .select({
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

      const fieldMap = new Map<string, { label: string; type: string; order: number; values: unknown[] }>();
      for (const a of answers) {
        const existing = fieldMap.get(a.fieldId);
        if (existing) {
          existing.values.push(a.value);
        } else {
          fieldMap.set(a.fieldId, { label: a.label, type: a.type, order: a.order, values: [a.value] });
        }
      }

      const fields = [...fieldMap.values()]
        .sort((a, b) => a.order - b.order)
        .map(({ label, type, values }) => {
          const n = values.length;
          let summary: string;

          if (type === "single_choice") {
            const counts: Record<string, number> = {};
            for (const v of values) { const s = String(v); counts[s] = (counts[s] ?? 0) + 1; }
            summary = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([opt, c]) => `${opt}: ${c}/${n}`).join(", ");
          } else if (type === "multiple_choice") {
            const counts: Record<string, number> = {};
            for (const v of values) {
              const arr = Array.isArray(v) ? v : [v];
              for (const item of arr) { const s = String(item); counts[s] = (counts[s] ?? 0) + 1; }
            }
            summary = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([opt, c]) => `${opt}: ${c}/${n}`).join(", ");
          } else if (type === "rating" || type === "number") {
            const nums = values.map((v) => Number(v)).filter((v) => !isNaN(v));
            if (nums.length === 0) { summary = "No numeric responses"; }
            else {
              const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
              summary = `avg ${avg.toFixed(1)}, range ${Math.min(...nums)}–${Math.max(...nums)} (${nums.length} responses)`;
            }
          } else {
            const strs = values.map((v) => String(v)).filter(Boolean).slice(0, 15);
            summary = strs.map((s) => `"${s}"`).join("\n");
          }

          return { label, type, summary };
        });

      return { formTitle, responseCount: responses.length, fields };
    }),

  list: formProcedure
    .output(responseListSchema)
    .query(async ({ ctx }) => {
      const versions = await db.select({ id: formVersionsTable.id })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, ctx.form.id));
      const versionIds = versions.map((v) => v.id);
      if (versionIds.length === 0) return [];

      const responses = await db.select({ id: responsesTable.id, completedAt: responsesTable.completedAt })
        .from(responsesTable)
        .where(and(inArray(responsesTable.formVersionId, versionIds), isNotNull(responsesTable.completedAt)))
        .orderBy(desc(responsesTable.completedAt));
      if (responses.length === 0) return [];

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

      const followups = await db.select({
        responseId: aiFollowupsTable.responseId,
        fieldId: aiFollowupsTable.fieldId,
        aiQuestion: aiFollowupsTable.aiQuestion,
        userAnswer: aiFollowupsTable.userAnswer,
      })
        .from(aiFollowupsTable)
        .where(inArray(aiFollowupsTable.responseId, responseIds));

      // Index followups by responseId+fieldId for O(1) lookup
      const followupIndex = new Map<string, { aiQuestion: string; userAnswer: string | null }>();
      for (const f of followups) {
        followupIndex.set(`${f.responseId}:${f.fieldId}`, {
          aiQuestion: f.aiQuestion,
          userAnswer: f.userAnswer,
        });
      }

      const byResponse = new Map<string, { fieldId: string; label: string; type: string; value: unknown; followup: { aiQuestion: string; userAnswer: string | null } | null }[]>();
      for (const a of answers) {
        const list = byResponse.get(a.responseId) ?? [];
        list.push({
          fieldId: a.fieldId,
          label: a.label,
          type: a.type,
          value: a.value,
          followup: followupIndex.get(`${a.responseId}:${a.fieldId}`) ?? null,
        });
        byResponse.set(a.responseId, list);
      }

      return responses.map((r) => ({
        id: r.id,
        completedAt: r.completedAt,
        answers: byResponse.get(r.id) ?? [],
      }));
    }),
});

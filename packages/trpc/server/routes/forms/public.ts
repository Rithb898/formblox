import { eq, and, asc } from "@repo/database";
import { formsTable, formVersionsTable, formFieldsTable, responsesTable, responseAnswersTable, aiFollowupsTable } from "@repo/database/schema";
import db from "@repo/database";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { buildResponseSchema } from "@repo/forms";
import { rateLimit } from "@repo/services/redis";
import { z } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { publicFormSchema, followupInputSchema } from "./model";

export const formsPublicRouter = router({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .output(publicFormSchema)
    .query(async ({ input }) => {
      const [form] = await db.select().from(formsTable)
        .where(eq(formsTable.publicSlug, input.slug))
        .limit(1);

      if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

      const [published] = await db.select().from(formVersionsTable)
        .where(and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")))
        .limit(1);

      if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
      if (!form.isAcceptingResponses) throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

      const fields = await db.select().from(formFieldsTable)
        .where(eq(formFieldsTable.formVersionId, published.id))
        .orderBy(asc(formFieldsTable.order));

      return {
        form: { id: form.id, publicSlug: form.publicSlug, isAcceptingResponses: form.isAcceptingResponses },
        version: { id: published.id, title: published.title, description: published.description },
        fields: fields.map((f) => ({ ...f, config: (f.config ?? {}) as Record<string, unknown> })),
      };
    }),

  submit: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        answers: z.record(z.string(), z.unknown()),
        followups: z.array(followupInputSchema).optional(),
        _gotcha: z.string().optional(),
      }),
    )
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Honeypot: bots fill the hidden field — fake success, store nothing.
      if (input._gotcha && input._gotcha.trim() !== "") {
        return { id: nanoid() };
      }

      const ip = ctx.ip ?? "unknown";
      const { allowed } = await rateLimit(`responses:submit:${ip}:${input.slug}`, 10, 60);
      if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "rate_limited" });

      // Re-resolve the published version from the slug — never trust a client-sent version.
      const [form] = await db.select().from(formsTable)
        .where(eq(formsTable.publicSlug, input.slug))
        .limit(1);
      if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

      const [published] = await db.select().from(formVersionsTable)
        .where(and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")))
        .limit(1);
      if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
      if (!form.isAcceptingResponses) throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

      const fields = await db.select().from(formFieldsTable)
        .where(eq(formFieldsTable.formVersionId, published.id))
        .orderBy(asc(formFieldsTable.order));

      const schema = buildResponseSchema(
        fields.map((f) => ({ id: f.id, type: f.type, required: f.required, config: f.config })),
      );
      const parsed = schema.safeParse(input.answers);
      if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "invalid_answers" });

      const id = await db.transaction(async (tx) => {
        const [response] = await tx
          .insert(responsesTable)
          .values({ formVersionId: published.id, responseToken: nanoid(), completedAt: new Date() })
          .returning();

        const entries = Object.entries(parsed.data);
        if (entries.length > 0) {
          await tx.insert(responseAnswersTable).values(
            entries.map(([fieldId, value]) => ({ responseId: response!.id, fieldId, value })),
          );
        }

        if (input.followups && input.followups.length > 0) {
          await tx.insert(aiFollowupsTable).values(
            input.followups.map((f) => ({
              responseId: response!.id,
              fieldId: f.fieldId,
              aiQuestion: f.aiQuestion,
              userAnswer: f.userAnswer ?? null,
            })),
          );
        }

        return response!.id;
      });

      return { id };
    }),

  saveFollowups: publicProcedure
    .input(z.object({
      responseId: z.string().uuid(),
      followups: z.array(followupInputSchema),
    }))
    .output(z.void())
    .mutation(async ({ input }) => {
      if (input.followups.length === 0) return;

      // Verify the response exists before writing
      const [response] = await db.select({ id: responsesTable.id })
        .from(responsesTable)
        .where(eq(responsesTable.id, input.responseId))
        .limit(1);
      if (!response) throw new TRPCError({ code: "NOT_FOUND" });

      await db.insert(aiFollowupsTable).values(
        input.followups.map((f) => ({
          responseId: input.responseId,
          fieldId: f.fieldId,
          aiQuestion: f.aiQuestion,
          userAnswer: f.userAnswer ?? null,
        })),
      );
    }),
});

import { eq, and, asc, count, sql } from "@repo/database";
import {
  formsTable,
  formVersionsTable,
  formFieldsTable,
  responsesTable,
  responseAnswersTable,
  aiFollowupsTable,
  usersTable,
  workspaceMembersTable,
} from "@repo/database/schema";
import db from "@repo/database";
import { emailService } from "@repo/services/email";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { buildResponseSchema, themeSchema } from "@repo/forms";
import {
  rateLimit,
  withCache,
  invalidateKeys,
  invalidatePattern,
  CacheKeys,
} from "@repo/services/redis";
import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { publicFormSchema, followupInputSchema, exploreFormSchema } from "./model";

const TAGS = ["Public Forms"];

export const formsPublicRouter = router({
  listPublic: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/forms", tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.array(exploreFormSchema))
    .query(async () => {
      return withCache(CacheKeys.formsPublicList(), 300, async () => {
        const rows = await db
          .select({
            id: formsTable.id,
            publicSlug: formsTable.publicSlug,
            title: formVersionsTable.title,
            description: formVersionsTable.description,
            publishedAt: formVersionsTable.publishedAt,
            fieldCount: sql<number>`cast(count(distinct ${formFieldsTable.id}) as int)`,
            responseCount: sql<number>`cast(count(distinct ${responsesTable.id}) as int)`,
          })
          .from(formsTable)
          .innerJoin(
            formVersionsTable,
            and(
              eq(formVersionsTable.formId, formsTable.id),
              eq(formVersionsTable.status, "published"),
            ),
          )
          .leftJoin(formFieldsTable, eq(formFieldsTable.formVersionId, formVersionsTable.id))
          .leftJoin(
            responsesTable,
            and(
              eq(responsesTable.formVersionId, formVersionsTable.id),
              sql`${responsesTable.completedAt} is not null`,
            ),
          )
          .where(and(eq(formsTable.visibility, "public"), sql`${formsTable.deletedAt} is null`))
          .groupBy(formsTable.id, formVersionsTable.id);

        return rows;
      });
    }),

  getBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: "/public/forms/{slug}", tags: TAGS } })
    .input(z.object({ slug: z.string() }))
    .output(publicFormSchema)
    .query(async ({ input }) => {
      return withCache(CacheKeys.formSlug(input.slug), 1800, async () => {
        const [form] = await db
          .select()
          .from(formsTable)
          .where(eq(formsTable.publicSlug, input.slug))
          .limit(1);

        if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

        const [published] = await db
          .select()
          .from(formVersionsTable)
          .where(
            and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")),
          )
          .limit(1);

        if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
        if (!form.isAcceptingResponses)
          throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

        const fields = await db
          .select()
          .from(formFieldsTable)
          .where(eq(formFieldsTable.formVersionId, published.id))
          .orderBy(asc(formFieldsTable.order));

        return {
          form: {
            id: form.id,
            publicSlug: form.publicSlug,
            isAcceptingResponses: form.isAcceptingResponses,
          },
          version: { id: published.id, title: published.title, description: published.description, theme: themeSchema.nullable().safeParse(published.theme).data ?? null },
          fields: fields.map((f) => ({
            ...f,
            config: (f.config ?? {}) as Record<string, unknown>,
          })),
        };
      });
    }),

  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/public/forms/{slug}/submit", tags: TAGS } })
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
      const [form] = await db
        .select()
        .from(formsTable)
        .where(eq(formsTable.publicSlug, input.slug))
        .limit(1);
      if (!form || form.deletedAt) throw new TRPCError({ code: "NOT_FOUND" });

      const [published] = await db
        .select()
        .from(formVersionsTable)
        .where(
          and(eq(formVersionsTable.formId, form.id), eq(formVersionsTable.status, "published")),
        )
        .limit(1);
      if (!published) throw new TRPCError({ code: "NOT_FOUND", message: "not_published" });
      if (!form.isAcceptingResponses)
        throw new TRPCError({ code: "FORBIDDEN", message: "not_accepting_responses" });

      const fields = await db
        .select()
        .from(formFieldsTable)
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
          await tx
            .insert(responseAnswersTable)
            .values(
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

      await Promise.all([
        invalidateKeys(CacheKeys.formResponses(form.id), CacheKeys.formSummary(form.id)),
        invalidatePattern(`form:ai-summary:${form.id}:*`),
      ]);

      // Fire-and-forget: notify workspace owner about new submission
      (async () => {
        try {
          const [owner] = await db
            .select({ email: usersTable.email })
            .from(workspaceMembersTable)
            .innerJoin(usersTable, eq(usersTable.id, workspaceMembersTable.userId))
            .where(
              and(
                eq(workspaceMembersTable.workspaceId, form.workspaceId),
                eq(workspaceMembersTable.role, "owner"),
              ),
            )
            .limit(1);

          if (owner?.email) {
            const countRows = await db
              .select({ count: sql<number>`cast(count(*) as int)` })
              .from(responsesTable)
              .where(
                and(
                  eq(responsesTable.formVersionId, published.id),
                  sql`${responsesTable.completedAt} is not null`,
                ),
              );
            const responseCount = countRows[0]?.count ?? 0;

            await emailService.sendNewResponseEmail({
              ownerEmail: owner.email,
              formTitle: published.title,
              formId: form.id,
              responseCount,
            });
          }
        } catch (err) {
          console.error("Failed to send new response email:", err);
        }
      })();

      return { id };
    }),

  saveFollowups: publicProcedure
    .meta({
      openapi: { method: "POST", path: "/public/responses/{responseId}/followups", tags: TAGS },
    })
    .input(
      z.object({
        responseId: z.string().uuid(),
        followups: z.array(followupInputSchema),
      }),
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      if (input.followups.length === 0) return;

      // Verify the response exists before writing; fetch formId for cache invalidation
      const [response] = await db
        .select({ id: responsesTable.id, formId: formVersionsTable.formId })
        .from(responsesTable)
        .innerJoin(formVersionsTable, eq(formVersionsTable.id, responsesTable.formVersionId))
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

      await invalidateKeys(CacheKeys.formResponses(response.formId));
    }),
});

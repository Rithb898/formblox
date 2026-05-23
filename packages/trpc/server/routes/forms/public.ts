import { eq, and, asc } from "@repo/database";
import { formsTable, formVersionsTable, formFieldsTable } from "@repo/database/schema";
import db from "@repo/database";
import { TRPCError } from "@trpc/server";
import { z } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { publicFormSchema } from "./model";

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
});

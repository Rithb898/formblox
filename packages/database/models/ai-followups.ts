import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { responsesTable } from "./responses";
import { formFieldsTable } from "./form-fields";

export const aiFollowupsTable = pgTable(
  "ai_followups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responsesTable.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),
    aiQuestion: text("ai_question").notNull(),
    userAnswer: text("user_answer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_followups_response_id_idx").on(table.responseId),
    index("ai_followups_field_id_idx").on(table.fieldId),
  ],
);

export type SelectAiFollowup = typeof aiFollowupsTable.$inferSelect;
export type InsertAiFollowup = typeof aiFollowupsTable.$inferInsert;

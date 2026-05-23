import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { responsesTable } from "./responses";
import { formFieldsTable } from "./form-fields";

export const responseAnswersTable = pgTable(
  "response_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responsesTable.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),
    value: jsonb("value").notNull(),
    answeredAt: timestamp("answered_at").notNull().defaultNow(),
  },
  (table) => [
    index("response_answers_response_id_idx").on(table.responseId),
    index("response_answers_field_id_idx").on(table.fieldId),
  ],
);

export type SelectResponseAnswer = typeof responseAnswersTable.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswersTable.$inferInsert;

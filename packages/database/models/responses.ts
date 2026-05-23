import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { formVersionsTable } from "./form-versions";
import { usersTable } from "./user";

export const responsesTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formVersionId: uuid("form_version_id")
      .notNull()
      .references(() => formVersionsTable.id, { onDelete: "restrict" }),
    respondentUserId: uuid("respondent_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    anonymousId: varchar("anonymous_id", { length: 255 }),
    responseToken: varchar("response_token", { length: 255 }).notNull().unique(),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("responses_form_version_id_idx").on(table.formVersionId),
    index("responses_completed_at_idx").on(table.completedAt),
  ],
);

export type SelectResponse = typeof responsesTable.$inferSelect;
export type InsertResponse = typeof responsesTable.$inferInsert;

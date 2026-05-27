import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { formsTable } from "./forms";

export const formVersionStatusEnum = pgEnum("form_version_status", [
  "draft",
  "published",
  "archived",
]);

export const formVersionsTable = pgTable(
  "form_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    status: formVersionStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 255 }).notNull().default(""),
    description: text("description"),
    welcomeScreen: jsonb("welcome_screen"),
    thankYouScreen: jsonb("thank_you_screen"),
    settings: jsonb("settings").notNull().default({}),
    theme: jsonb("theme"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("form_versions_form_id_idx").on(table.formId),
    uniqueIndex("form_versions_one_draft_per_form")
      .on(table.formId)
      .where(sql`${table.status} = 'draft'`),
    uniqueIndex("form_versions_one_published_per_form")
      .on(table.formId)
      .where(sql`${table.status} = 'published'`),
  ],
);

export type SelectFormVersion = typeof formVersionsTable.$inferSelect;
export type InsertFormVersion = typeof formVersionsTable.$inferInsert;

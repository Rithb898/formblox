import { pgTable, uuid, varchar, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspacesTable } from "./workspaces";

export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    publicSlug: varchar("public_slug", { length: 10 }).notNull().unique(),
    isAcceptingResponses: boolean("is_accepting_responses").notNull().default(true),
    visibility: formVisibilityEnum("visibility").notNull().default("unlisted"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("forms_workspace_id_idx").on(table.workspaceId),
    index("forms_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("forms_visibility_idx").on(table.visibility),
  ],
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;

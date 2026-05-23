import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { workspacesTable } from "./workspaces";

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("owner"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("workspace_members_workspace_user_idx").on(table.workspaceId, table.userId)],
);

export type SelectWorkspaceMember = typeof workspaceMembersTable.$inferSelect;
export type InsertWorkspaceMember = typeof workspaceMembersTable.$inferInsert;

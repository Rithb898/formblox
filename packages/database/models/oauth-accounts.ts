import { pgTable, uuid, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const oauthAccountsTable = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [unique().on(t.provider, t.providerUserId)],
);

export type SelectOauthAccount = typeof oauthAccountsTable.$inferSelect;
export type InsertOauthAccount = typeof oauthAccountsTable.$inferInsert;

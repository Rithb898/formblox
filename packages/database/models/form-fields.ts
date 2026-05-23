import { pgTable, integer, boolean, text, jsonb, pgEnum, timestamp, uniqueIndex, index, uuid } from "drizzle-orm/pg-core";
import { formVersionsTable } from "./form-versions";
import { FIELD_TYPES } from "@repo/forms/field-types";

export const fieldTypeEnum = pgEnum("field_type", FIELD_TYPES);

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: text("id").primaryKey(),
    formVersionId: uuid("form_version_id")
      .notNull()
      .references(() => formVersionsTable.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    type: fieldTypeEnum("type").notNull(),
    label: text("label").notNull().default(""),
    required: boolean("required").notNull().default(false),
    config: jsonb("config").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("form_fields_version_id_idx").on(table.formVersionId),
    uniqueIndex("form_fields_version_order_idx").on(table.formVersionId, table.order),
  ],
);

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;

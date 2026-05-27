CREATE TYPE "public"."form_visibility" AS ENUM('public', 'unlisted');--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "visibility" "form_visibility" DEFAULT 'unlisted' NOT NULL;--> statement-breakpoint
CREATE INDEX "forms_visibility_idx" ON "forms" USING btree ("visibility");
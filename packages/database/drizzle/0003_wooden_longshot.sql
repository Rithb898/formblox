CREATE TYPE "public"."form_version_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('short_text', 'long_text', 'email', 'number', 'single_choice', 'multiple_choice', 'rating', 'date');--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_by" uuid NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"public_slug" varchar(10) NOT NULL,
	"is_accepting_responses" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "forms_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" "form_version_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"description" text,
	"welcome_screen" jsonb,
	"thank_you_screen" jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_version_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"type" "field_type" NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_version_id" uuid NOT NULL,
	"respondent_user_id" uuid,
	"anonymous_id" varchar(255),
	"response_token" varchar(255) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "responses_response_token_unique" UNIQUE("response_token")
);
--> statement-breakpoint
CREATE TABLE "response_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_user_id_users_id_fk" FOREIGN KEY ("respondent_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_idx" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "forms_workspace_id_idx" ON "forms" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "forms_deleted_at_idx" ON "forms" USING btree ("deleted_at") WHERE "forms"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "form_versions_form_id_idx" ON "form_versions" USING btree ("form_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_versions_one_draft_per_form" ON "form_versions" USING btree ("form_id") WHERE "form_versions"."status" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX "form_versions_one_published_per_form" ON "form_versions" USING btree ("form_id") WHERE "form_versions"."status" = 'published';--> statement-breakpoint
CREATE INDEX "form_fields_version_id_idx" ON "form_fields" USING btree ("form_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_fields_version_order_idx" ON "form_fields" USING btree ("form_version_id","order");--> statement-breakpoint
CREATE INDEX "responses_form_version_id_idx" ON "responses" USING btree ("form_version_id");--> statement-breakpoint
CREATE INDEX "responses_completed_at_idx" ON "responses" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "response_answers_response_id_idx" ON "response_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_answers_field_id_idx" ON "response_answers" USING btree ("field_id");
CREATE TABLE "ai_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"field_id" text NOT NULL,
	"ai_question" text NOT NULL,
	"user_answer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_followups" ADD CONSTRAINT "ai_followups_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_followups" ADD CONSTRAINT "ai_followups_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_followups_response_id_idx" ON "ai_followups" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "ai_followups_field_id_idx" ON "ai_followups" USING btree ("field_id");
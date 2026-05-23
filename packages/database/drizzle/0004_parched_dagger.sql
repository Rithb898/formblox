ALTER TABLE "response_answers" DROP CONSTRAINT "response_answers_field_id_form_fields_id_fk";--> statement-breakpoint
ALTER TABLE "form_fields" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "form_fields" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "response_answers" ALTER COLUMN "field_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE restrict ON UPDATE no action;

CREATE TABLE "analysis_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"reserved_tokens" integer NOT NULL,
	"used_tokens" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "analysis_attempts_reserved_tokens_check" CHECK ("analysis_attempts"."reserved_tokens" >= 0),
	CONSTRAINT "analysis_attempts_used_tokens_check" CHECK ("analysis_attempts"."used_tokens" >= 0),
	CONSTRAINT "analysis_attempts_finished" CHECK (("analysis_attempts"."used_tokens" is not null) = ("analysis_attempts"."finished_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "analysis_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "analysis_attempts" ADD CONSTRAINT "analysis_attempts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_attempts_started" ON "analysis_attempts" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "analysis_attempts_project" ON "analysis_attempts" USING btree ("project_id","started_at");
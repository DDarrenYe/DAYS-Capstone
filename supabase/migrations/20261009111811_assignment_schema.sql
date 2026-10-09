CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."assignment_lane" AS ENUM('lane_1', 'lane_2');--> statement-breakpoint
CREATE TYPE "public"."flag_review_state" AS ENUM('open', 'dismissed', 'added_to_feedback');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('manual', 'public_link', 'pasted_text');--> statement-breakpoint
CREATE TYPE "public"."profile_role" AS ENUM('student', 'instructor');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"final_version_id" uuid NOT NULL,
	"iteration_id" uuid NOT NULL,
	"analysis_version" text NOT NULL,
	"model" text NOT NULL,
	"rubric_version" text NOT NULL,
	"ai_correctness_addressed" boolean NOT NULL,
	"ai_correctness_evidence" text NOT NULL,
	"verification_addressed" boolean NOT NULL,
	"verification_evidence" text NOT NULL,
	"changes_addressed" boolean NOT NULL,
	"changes_evidence" text NOT NULL,
	"explanation" text NOT NULL,
	"uncertainty" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_results_version_step_run_key" UNIQUE("final_version_id","iteration_id","analysis_version"),
	CONSTRAINT "analysis_results_analysis_version_check" CHECK (btrim("analysis_results"."analysis_version") <> ''),
	CONSTRAINT "analysis_results_model_check" CHECK (btrim("analysis_results"."model") <> ''),
	CONSTRAINT "analysis_results_rubric_version_check" CHECK (btrim("analysis_results"."rubric_version") <> ''),
	CONSTRAINT "analysis_results_explanation_check" CHECK (btrim("analysis_results"."explanation") <> ''),
	CONSTRAINT "analysis_results_uncertainty_check" CHECK (btrim("analysis_results"."uncertainty") <> '')
);
--> statement-breakpoint
ALTER TABLE "analysis_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"brief" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone,
	"lane" "assignment_lane" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_id_course_id_key" UNIQUE("id","course_id"),
	CONSTRAINT "assignments_title_check" CHECK (btrim("assignments"."title") <> '')
);
--> statement-breakpoint
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_instructor_id_code_key" UNIQUE("instructor_id","code"),
	CONSTRAINT "courses_code_check" CHECK (btrim("courses"."code") <> ''),
	CONSTRAINT "courses_title_check" CHECK (btrim("courses"."title") <> '')
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "enrolments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"student_id" uuid,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrolments_course_id_student_id_key" UNIQUE("course_id","student_id"),
	CONSTRAINT "enrolments_course_id_email_key" UNIQUE("course_id","email"),
	CONSTRAINT "enrolments_email_check" CHECK ("enrolments"."email" = lower(btrim("enrolments"."email")) and "enrolments"."email" like '%_@_%._%')
);
--> statement-breakpoint
ALTER TABLE "enrolments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "final_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"extracted_text" text DEFAULT '' NOT NULL,
	"original_filename" text,
	"is_current" boolean DEFAULT true NOT NULL,
	"submitted_at" timestamp with time zone,
	"matching_version" text,
	"match_results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "final_versions_id_project_id_key" UNIQUE("id","project_id"),
	CONSTRAINT "final_versions_project_id_version_number_key" UNIQUE("project_id","version_number"),
	CONSTRAINT "final_versions_version_number_check" CHECK ("final_versions"."version_number" > 0),
	CONSTRAINT "final_versions_original_filename_check" CHECK (btrim("final_versions"."original_filename") <> ''),
	CONSTRAINT "final_versions_matching_version_check" CHECK (btrim("final_versions"."matching_version") <> ''),
	CONSTRAINT "final_versions_matching_version" CHECK (("final_versions"."matching_version" is not null) = ("final_versions"."match_results" is not null)),
	CONSTRAINT "final_versions_match_results_object" CHECK ("final_versions"."match_results" is null or jsonb_typeof("final_versions"."match_results") = 'object')
);
--> statement-breakpoint
ALTER TABLE "final_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "flag_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_id" uuid NOT NULL,
	"review_state" "flag_review_state" NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flag_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_result_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"evidence" text NOT NULL,
	"explanation" text NOT NULL,
	"review_state" "flag_review_state" DEFAULT 'open' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flags_analysis_result_id_kind_key" UNIQUE("analysis_result_id","kind"),
	CONSTRAINT "flags_kind_check" CHECK (btrim("flags"."kind") <> ''),
	CONSTRAINT "flags_evidence_check" CHECK (btrim("flags"."evidence") <> ''),
	CONSTRAINT "flags_explanation_check" CHECK (btrim("flags"."explanation") <> ''),
	CONSTRAINT "flags_review_timestamp" CHECK (("flags"."reviewed_by" is null) = ("flags"."reviewed_at" is null)),
	CONSTRAINT "flags_review_attribution" CHECK ("flags"."review_state" = 'open' or "flags"."reviewed_by" is not null)
);
--> statement-breakpoint
ALTER TABLE "flags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "grader_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"iteration_id" uuid,
	"final_version_id" uuid,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grader_notes_body_check" CHECK (btrim("grader_notes"."body") <> '')
);
--> statement-breakpoint
ALTER TABLE "grader_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "iterations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"ai_tool" text NOT NULL,
	"prompt" text NOT NULL,
	"raw_answer" text NOT NULL,
	"critique" text,
	"import_source" "import_source" DEFAULT 'manual' NOT NULL,
	"source_url" text,
	"source_conversation_id" text,
	"source_step_id" text,
	"imported_at" timestamp with time zone,
	"student_marked_ai_error" boolean DEFAULT false NOT NULL,
	"ai_error_evidence" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "iterations_id_project_id_key" UNIQUE("id","project_id"),
	CONSTRAINT "iterations_project_id_step_number_key" UNIQUE("project_id","step_number") DEFERRABLE INITIALLY IMMEDIATE,
	CONSTRAINT "iterations_imported_source_key" UNIQUE("project_id","ai_tool","source_conversation_id","source_step_id"),
	CONSTRAINT "iterations_step_number_check" CHECK ("iterations"."step_number" > 0),
	CONSTRAINT "iterations_ai_tool_check" CHECK (btrim("iterations"."ai_tool") <> ''),
	CONSTRAINT "iterations_prompt_check" CHECK (btrim("iterations"."prompt") <> ''),
	CONSTRAINT "iterations_raw_answer_check" CHECK (btrim("iterations"."raw_answer") <> ''),
	CONSTRAINT "iterations_critique_check" CHECK (btrim("iterations"."critique") <> ''),
	CONSTRAINT "iterations_ai_error_evidence_check" CHECK (btrim("iterations"."ai_error_evidence") <> ''),
	CONSTRAINT "iterations_public_link_provenance" CHECK ("iterations"."import_source" <> 'public_link' or ("iterations"."source_url" is not null and "iterations"."source_url" ~ '^https?://')),
	CONSTRAINT "iterations_import_timestamp" CHECK ("iterations"."import_source" = 'manual' or "iterations"."imported_at" is not null),
	CONSTRAINT "iterations_student_error_evidence" CHECK ("iterations"."student_marked_ai_error" = ("iterations"."ai_error_evidence" is not null))
);
--> statement-breakpoint
ALTER TABLE "iterations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"role" "profile_role" DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_display_name_check" CHECK (btrim("profiles"."display_name") <> '')
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"analysis_status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"analysis_version" text,
	"analysis_error" text,
	"analysis_started_at" timestamp with time zone,
	"analysis_finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_assignment_id_student_id_key" UNIQUE("assignment_id","student_id"),
	CONSTRAINT "projects_analysis_version_check" CHECK (btrim("projects"."analysis_version") <> ''),
	CONSTRAINT "projects_analysis_error_check" CHECK (btrim("projects"."analysis_error") <> ''),
	CONSTRAINT "projects_submission_timestamp" CHECK (("projects"."status" = 'submitted') = ("projects"."submitted_at" is not null)),
	CONSTRAINT "projects_analysis_started" CHECK ("projects"."analysis_status" = 'pending' or ("projects"."status" = 'submitted' and "projects"."analysis_version" is not null and "projects"."analysis_started_at" is not null)),
	CONSTRAINT "projects_analysis_error" CHECK (("projects"."analysis_status" = 'failed') = ("projects"."analysis_error" is not null)),
	CONSTRAINT "projects_analysis_finished" CHECK (("projects"."analysis_status" in ('completed', 'failed')) = ("projects"."analysis_finished_at" is not null)),
	CONSTRAINT "projects_analysis_time_order" CHECK ("projects"."analysis_finished_at" >= "projects"."analysis_started_at")
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_final_version_id_project_id_fkey" FOREIGN KEY ("final_version_id","project_id") REFERENCES "public"."final_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_iteration_id_project_id_fkey" FOREIGN KEY ("iteration_id","project_id") REFERENCES "public"."iterations"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_versions" ADD CONSTRAINT "final_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_reviews" ADD CONSTRAINT "flag_reviews_flag_id_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_reviews" ADD CONSTRAINT "flag_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_analysis_result_id_analysis_results_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."analysis_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grader_notes" ADD CONSTRAINT "grader_notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grader_notes" ADD CONSTRAINT "grader_notes_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grader_notes" ADD CONSTRAINT "grader_notes_iteration_id_project_id_fkey" FOREIGN KEY ("iteration_id","project_id") REFERENCES "public"."iterations"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grader_notes" ADD CONSTRAINT "grader_notes_final_version_id_project_id_fkey" FOREIGN KEY ("final_version_id","project_id") REFERENCES "public"."final_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iterations" ADD CONSTRAINT "iterations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_assignment_id_course_id_fkey" FOREIGN KEY ("assignment_id","course_id") REFERENCES "public"."assignments"("id","course_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_course_id_student_id_fkey" FOREIGN KEY ("course_id","student_id") REFERENCES "public"."enrolments"("course_id","student_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_results_iteration" ON "analysis_results" USING btree ("iteration_id","project_id");--> statement-breakpoint
CREATE INDEX "assignments_course" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "enrolments_student" ON "enrolments" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "final_versions_one_current" ON "final_versions" USING btree ("project_id") WHERE "final_versions"."is_current";--> statement-breakpoint
CREATE INDEX "flag_reviews_flag" ON "flag_reviews" USING btree ("flag_id");--> statement-breakpoint
CREATE INDEX "flag_reviews_reviewer" ON "flag_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "flags_reviewer" ON "flags" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "grader_notes_project" ON "grader_notes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "grader_notes_iteration" ON "grader_notes" USING btree ("iteration_id","project_id");--> statement-breakpoint
CREATE INDEX "grader_notes_final" ON "grader_notes" USING btree ("final_version_id","project_id");--> statement-breakpoint
CREATE INDEX "grader_notes_author" ON "grader_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "projects_enrolment" ON "projects" USING btree ("course_id","student_id");
--> statement-breakpoint
create function public.enforce_project_lane() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.assignments where id = new.assignment_id and lane = 'lane_2' for share) then
    raise check_violation using message = 'Projects require a Lane 2 assignment';
  end if;
  return new;
end;
$$;
create trigger projects_require_lane_2 before insert or update of assignment_id on public.projects
  for each row execute function public.enforce_project_lane();

create function public.protect_assignment_lane() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.lane = 'lane_1' and exists (select 1 from public.projects where assignment_id = new.id) then
    raise check_violation using message = 'An assignment with AI projects cannot move to Lane 1';
  end if;
  return new;
end;
$$;
create trigger assignments_protect_lane before update of lane on public.assignments
  for each row execute function public.protect_assignment_lane();

create function public.protect_iteration_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.project_id <> old.project_id then
    raise check_violation using message = 'Step identity and project cannot change';
  end if;
  return new;
end;
$$;
create trigger iterations_stable_identity before update of id, project_id on public.iterations
  for each row execute function public.protect_iteration_identity();

create function public.protect_final_version_text() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.id, new.project_id, new.version_number, new.extracted_text, new.original_filename)
    is distinct from (old.id, old.project_id, old.version_number, old.extracted_text, old.original_filename) then
    raise check_violation using message = 'Save edited final text as a new version';
  end if;
  return new;
end;
$$;
create trigger final_versions_stable_text before update on public.final_versions
  for each row execute function public.protect_final_version_text();

create function public.record_flag_review() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.reviewed_by is not null) or (tg_op = 'UPDATE' and
    (new.review_state, new.reviewed_by, new.reviewed_at) is distinct from (old.review_state, old.reviewed_by, old.reviewed_at)) then
    if new.reviewed_by is null then
      raise check_violation using message = 'Review changes require a reviewer and time, including reopening';
    end if;
    insert into public.flag_reviews (flag_id, review_state, reviewer_id, reviewed_at)
      values (new.id, new.review_state, new.reviewed_by, new.reviewed_at);
  end if;
  return new;
end;
$$;
create trigger flags_record_review after insert or update on public.flags
  for each row execute function public.record_flag_review();

revoke all on function public.enforce_project_lane() from public;
revoke all on function public.protect_assignment_lane() from public;
revoke all on function public.protect_iteration_identity() from public;
revoke all on function public.record_flag_review() from public;
revoke all on function public.protect_final_version_text() from public;

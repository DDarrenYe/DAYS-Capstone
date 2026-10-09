import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

export const profileRole = pgEnum("profile_role", ["student", "instructor"]);
export const assignmentLane = pgEnum("assignment_lane", ["lane_1", "lane_2"]);
export const projectStatus = pgEnum("project_status", ["draft", "submitted"]);
export const analysisStatus = pgEnum("analysis_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);
export const importSource = pgEnum("import_source", [
  "manual",
  "public_link",
  "pasted_text",
]);
export const flagReviewState = pgEnum("flag_review_state", [
  "open",
  "dismissed",
  "added_to_feedback",
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    role: profileRole("role").default("student").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("profiles_display_name_check", sql`btrim(${t.displayName}) <> ''`),
  ]
).enableRLS();

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instructorId: uuid("instructor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("courses_code_check", sql`btrim(${t.code}) <> ''`),
    check("courses_title_check", sql`btrim(${t.title}) <> ''`),
    unique("courses_instructor_id_code_key").on(t.instructorId, t.code),
  ]
).enableRLS();

export const enrolments = pgTable(
  "enrolments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    studentId: uuid("student_id").references(() => profiles.id, {
      onDelete: "restrict",
    }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      "enrolments_email_check",
      sql`${t.email} = lower(btrim(${t.email})) and ${t.email} like '%_@_%._%'`
    ),
    unique("enrolments_course_id_student_id_key").on(t.courseId, t.studentId),
    unique("enrolments_course_id_email_key").on(t.courseId, t.email),
    index("enrolments_student").on(t.studentId),
  ]
).enableRLS();

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    brief: text("brief").default("").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }),
    lane: assignmentLane("lane").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("assignments_title_check", sql`btrim(${t.title}) <> ''`),
    unique("assignments_id_course_id_key").on(t.id, t.courseId),
    index("assignments_course").on(t.courseId),
  ]
).enableRLS();

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id").notNull(),
    courseId: uuid("course_id").notNull(),
    studentId: uuid("student_id").notNull(),
    status: projectStatus("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "string",
    }),
    analysisStatus: analysisStatus("analysis_status")
      .default("pending")
      .notNull(),
    analysisVersion: text("analysis_version"),
    analysisError: text("analysis_error"),
    analysisStartedAt: timestamp("analysis_started_at", {
      withTimezone: true,
      mode: "string",
    }),
    analysisFinishedAt: timestamp("analysis_finished_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      "projects_analysis_version_check",
      sql`btrim(${t.analysisVersion}) <> ''`
    ),
    check(
      "projects_analysis_error_check",
      sql`btrim(${t.analysisError}) <> ''`
    ),
    unique("projects_assignment_id_student_id_key").on(
      t.assignmentId,
      t.studentId
    ),
    foreignKey({
      name: "projects_assignment_id_course_id_fkey",
      columns: [t.assignmentId, t.courseId],
      foreignColumns: [assignments.id, assignments.courseId],
    }).onDelete("restrict"),
    foreignKey({
      name: "projects_course_id_student_id_fkey",
      columns: [t.courseId, t.studentId],
      foreignColumns: [enrolments.courseId, enrolments.studentId],
    }).onDelete("restrict"),
    check(
      "projects_submission_timestamp",
      sql`(${t.status} = 'submitted') = (${t.submittedAt} is not null)`
    ),
    check(
      "projects_analysis_started",
      sql`${t.analysisStatus} = 'pending' or (${t.status} = 'submitted' and ${t.analysisVersion} is not null and ${t.analysisStartedAt} is not null)`
    ),
    check(
      "projects_analysis_error",
      sql`(${t.analysisStatus} = 'failed') = (${t.analysisError} is not null)`
    ),
    check(
      "projects_analysis_finished",
      sql`(${t.analysisStatus} in ('completed', 'failed')) = (${t.analysisFinishedAt} is not null)`
    ),
    check(
      "projects_analysis_time_order",
      sql`${t.analysisFinishedAt} >= ${t.analysisStartedAt}`
    ),
    index("projects_enrolment").on(t.courseId, t.studentId),
  ]
).enableRLS();

export const iterations = pgTable(
  "iterations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    aiTool: text("ai_tool").notNull(),
    prompt: text("prompt").notNull(),
    rawAnswer: text("raw_answer").notNull(),
    critique: text("critique"),
    importSource: importSource("import_source").default("manual").notNull(),
    sourceUrl: text("source_url"),
    sourceConversationId: text("source_conversation_id"),
    sourceStepId: text("source_step_id"),
    importedAt: timestamp("imported_at", {
      withTimezone: true,
      mode: "string",
    }),
    studentMarkedAiError: boolean("student_marked_ai_error")
      .default(false)
      .notNull(),
    aiErrorEvidence: text("ai_error_evidence"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("iterations_step_number_check", sql`${t.stepNumber} > 0`),
    check("iterations_ai_tool_check", sql`btrim(${t.aiTool}) <> ''`),
    check("iterations_prompt_check", sql`btrim(${t.prompt}) <> ''`),
    check("iterations_raw_answer_check", sql`btrim(${t.rawAnswer}) <> ''`),
    check("iterations_critique_check", sql`btrim(${t.critique}) <> ''`),
    check(
      "iterations_ai_error_evidence_check",
      sql`btrim(${t.aiErrorEvidence}) <> ''`
    ),
    unique("iterations_id_project_id_key").on(t.id, t.projectId),
    unique("iterations_project_id_step_number_key").on(
      t.projectId,
      t.stepNumber
    ),
    unique("iterations_imported_source_key").on(
      t.projectId,
      t.aiTool,
      t.sourceConversationId,
      t.sourceStepId
    ),
    check(
      "iterations_public_link_provenance",
      sql`${t.importSource} <> 'public_link' or (${t.sourceUrl} is not null and ${t.sourceUrl} ~ '^https?://')`
    ),
    check(
      "iterations_import_timestamp",
      sql`${t.importSource} = 'manual' or ${t.importedAt} is not null`
    ),
    check(
      "iterations_student_error_evidence",
      sql`${t.studentMarkedAiError} = (${t.aiErrorEvidence} is not null)`
    ),
  ]
).enableRLS();

export const finalVersions = pgTable(
  "final_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    extractedText: text("extracted_text").default("").notNull(),
    originalFilename: text("original_filename"),
    isCurrent: boolean("is_current").default(true).notNull(),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "string",
    }),
    matchingVersion: text("matching_version"),
    matchResults: jsonb("match_results"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("final_versions_version_number_check", sql`${t.versionNumber} > 0`),
    check(
      "final_versions_original_filename_check",
      sql`btrim(${t.originalFilename}) <> ''`
    ),
    check(
      "final_versions_matching_version_check",
      sql`btrim(${t.matchingVersion}) <> ''`
    ),
    unique("final_versions_id_project_id_key").on(t.id, t.projectId),
    unique("final_versions_project_id_version_number_key").on(
      t.projectId,
      t.versionNumber
    ),
    check(
      "final_versions_matching_version",
      sql`(${t.matchingVersion} is not null) = (${t.matchResults} is not null)`
    ),
    check(
      "final_versions_match_results_object",
      sql`${t.matchResults} is null or jsonb_typeof(${t.matchResults}) = 'object'`
    ),
    uniqueIndex("final_versions_one_current")
      .on(t.projectId)
      .where(sql`${t.isCurrent}`),
  ]
).enableRLS();

export const analysisResults = pgTable(
  "analysis_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    finalVersionId: uuid("final_version_id").notNull(),
    iterationId: uuid("iteration_id").notNull(),
    analysisVersion: text("analysis_version").notNull(),
    model: text("model").notNull(),
    rubricVersion: text("rubric_version").notNull(),
    aiCorrectnessAddressed: boolean("ai_correctness_addressed").notNull(),
    aiCorrectnessEvidence: text("ai_correctness_evidence").notNull(),
    verificationAddressed: boolean("verification_addressed").notNull(),
    verificationEvidence: text("verification_evidence").notNull(),
    changesAddressed: boolean("changes_addressed").notNull(),
    changesEvidence: text("changes_evidence").notNull(),
    explanation: text("explanation").notNull(),
    uncertainty: text("uncertainty").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      "analysis_results_analysis_version_check",
      sql`btrim(${t.analysisVersion}) <> ''`
    ),
    check("analysis_results_model_check", sql`btrim(${t.model}) <> ''`),
    check(
      "analysis_results_rubric_version_check",
      sql`btrim(${t.rubricVersion}) <> ''`
    ),
    check(
      "analysis_results_explanation_check",
      sql`btrim(${t.explanation}) <> ''`
    ),
    check(
      "analysis_results_uncertainty_check",
      sql`btrim(${t.uncertainty}) <> ''`
    ),
    unique("analysis_results_version_step_run_key").on(
      t.finalVersionId,
      t.iterationId,
      t.analysisVersion
    ),
    foreignKey({
      name: "analysis_results_final_version_id_project_id_fkey",
      columns: [t.finalVersionId, t.projectId],
      foreignColumns: [finalVersions.id, finalVersions.projectId],
    }).onDelete("no action"),
    foreignKey({
      name: "analysis_results_iteration_id_project_id_fkey",
      columns: [t.iterationId, t.projectId],
      foreignColumns: [iterations.id, iterations.projectId],
    }).onDelete("no action"),
    index("analysis_results_iteration").on(t.iterationId, t.projectId),
  ]
).enableRLS();

export const flags = pgTable(
  "flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisResultId: uuid("analysis_result_id")
      .notNull()
      .references(() => analysisResults.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    evidence: text("evidence").notNull(),
    explanation: text("explanation").notNull(),
    reviewState: flagReviewState("review_state").default("open").notNull(),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("flags_kind_check", sql`btrim(${t.kind}) <> ''`),
    check("flags_evidence_check", sql`btrim(${t.evidence}) <> ''`),
    check("flags_explanation_check", sql`btrim(${t.explanation}) <> ''`),
    unique("flags_analysis_result_id_kind_key").on(t.analysisResultId, t.kind),
    check(
      "flags_review_timestamp",
      sql`(${t.reviewedBy} is null) = (${t.reviewedAt} is null)`
    ),
    check(
      "flags_review_attribution",
      sql`${t.reviewState} = 'open' or ${t.reviewedBy} is not null`
    ),
    index("flags_reviewer").on(t.reviewedBy),
  ]
).enableRLS();

export const flagReviews = pgTable(
  "flag_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flagId: uuid("flag_id")
      .notNull()
      .references(() => flags.id, { onDelete: "cascade" }),
    reviewState: flagReviewState("review_state").notNull(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("flag_reviews_flag").on(t.flagId),
    index("flag_reviews_reviewer").on(t.reviewerId),
  ]
).enableRLS();

export const graderNotes = pgTable(
  "grader_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    iterationId: uuid("iteration_id"),
    finalVersionId: uuid("final_version_id"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check("grader_notes_body_check", sql`btrim(${t.body}) <> ''`),
    foreignKey({
      name: "grader_notes_iteration_id_project_id_fkey",
      columns: [t.iterationId, t.projectId],
      foreignColumns: [iterations.id, iterations.projectId],
    }).onDelete("no action"),
    foreignKey({
      name: "grader_notes_final_version_id_project_id_fkey",
      columns: [t.finalVersionId, t.projectId],
      foreignColumns: [finalVersions.id, finalVersions.projectId],
    }).onDelete("no action"),
    index("grader_notes_project").on(t.projectId),
    index("grader_notes_iteration").on(t.iterationId, t.projectId),
    index("grader_notes_final").on(t.finalVersionId, t.projectId),
    index("grader_notes_author").on(t.authorId),
  ]
).enableRLS();

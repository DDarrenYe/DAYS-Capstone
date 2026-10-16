import type {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { QueryClient, QueryKey } from "@tanstack/query-core";

import { submissionMetrics } from "@/lib/submission-metrics";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export const queryKeys = {
  assignments: (userId: string) => ["users", userId, "assignments"] as const,
  cohortMetrics: (userId: string) =>
    [...queryKeys.submissions(userId), "metrics"] as const,
  courses: (userId: string) => ["users", userId, "courses"] as const,
  flagQueue: (userId: string) => ["users", userId, "flags"] as const,
  metrics: (userId: string, projectId: string) =>
    [...queryKeys.project(userId, projectId), "metrics"] as const,
  project: (userId: string, projectId: string) =>
    ["users", userId, "projects", projectId] as const,
  projectLog: (userId: string, projectId: string) =>
    [...queryKeys.project(userId, projectId), "log"] as const,
  reviews: (userId: string, projectId: string) =>
    [...queryKeys.project(userId, projectId), "reviews"] as const,
  submission: (userId: string, projectId: string) =>
    [...queryKeys.submissions(userId), projectId] as const,
  submissions: (userId: string) => ["users", userId, "submissions"] as const,
  unresolvedFlags: (userId: string) =>
    ["users", userId, "unresolved-flags"] as const,
};

const unwrap = <T>(
  { data, error }: PostgrestSingleResponse<T>,
  subject: string
) => {
  if (error || data === null) {
    throw new Error(`Unable to load ${subject}.`, { cause: error });
  }
  return data;
};

const asUser = async <T>(
  client: Client,
  userId: string,
  read: (client: Client) => Promise<T>
) => {
  const { data } = await client.auth.getClaims();
  if (data?.claims.sub !== userId) {
    throw new Error("Your session changed. Reload the page to continue.");
  }
  return read(client);
};

const readAssignments = async (client: Client) =>
  unwrap(
    await client
      .from("assignments")
      .select(
        "id, title, brief, due_at, lane, course:courses(code, title), projects(id, status, submitted_at, iterations(count))"
      )
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at"),
    "assignments"
  );

export type AssignmentRows = Awaited<ReturnType<typeof readAssignments>>;

const readCourses = async (client: Client) =>
  unwrap(
    await client
      .from("courses")
      .select(
        "id, code, title, assignments(id, title, due_at, lane), enrolments(id, email, student_id, has_work)"
      )
      .order("created_at")
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
        referencedTable: "assignments",
      })
      .order("created_at", { referencedTable: "assignments" })
      .order("email", { referencedTable: "enrolments" }),
    "courses"
  );

export type CourseRows = Awaited<ReturnType<typeof readCourses>>;

const readProjectLog = async (client: Client, projectId: string) =>
  unwrap(
    await client
      .from("projects")
      .select(
        "id, assignment_id, status, submitted_at, iterations(id, step_number, ai_tool, prompt, raw_answer, critique, import_source, source_url, imported_at, marks, student_marked_ai_error, ai_error_evidence, created_at), final_versions(id, version_number, extracted_text, original_filename, created_at)"
      )
      .eq("id", projectId)
      .eq("final_versions.is_current", true)
      .order("step_number", { referencedTable: "iterations" })
      .maybeSingle(),
    "the project log"
  );

export type ProjectLog = Awaited<ReturnType<typeof readProjectLog>>;

const readSubmissions = async (client: Client) =>
  unwrap(
    await client
      .from("projects")
      .select(
        "id, submitted_at, analysis_status, assignment:assignments(id, title), student:enrolments(email)"
      )
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false }),
    "submissions"
  );

const METRICS_COLUMNS =
  "analysis_status, iterations(id, step_number, raw_answer, critique, student_marked_ai_error), final_versions(id, version_number, extracted_text), analysis_results(final_version_id, analysis_version, created_at, flags(kind, review_state))";

const readProjectMetrics = async (client: Client, projectId: string) =>
  submissionMetrics(
    unwrap(
      await client
        .from("projects")
        .select(METRICS_COLUMNS)
        .eq("id", projectId)
        .eq("final_versions.is_current", true)
        .maybeSingle(),
      "the submission metrics"
    )
  );

/* Each project carries its steps and essay text, so the cohort is read in batches; one request would also stop at the API's row limit. */
const COHORT_BATCH = 200;

const inBatches = async <T>(
  read: (from: number) => Promise<T[]>,
  from = 0
): Promise<T[]> => {
  const batch = await read(from);
  return batch.length < COHORT_BATCH
    ? batch
    : [...batch, ...(await inBatches(read, from + COHORT_BATCH))];
};

const readCohortBatch = async (client: Client, from: number) =>
  unwrap(
    await client
      .from("projects")
      .select(
        `id, submitted_at, assignment:assignments(id, title), student:enrolments(email, profile:profiles(display_name)), ${METRICS_COLUMNS}`
      )
      .eq("status", "submitted")
      .eq("final_versions.is_current", true)
      .order("submitted_at", { ascending: false })
      .order("id")
      .range(from, from + COHORT_BATCH - 1),
    "the cohort metrics"
  );

const readCohortMetrics = async (client: Client) => {
  const projects = await inBatches((from) => readCohortBatch(client, from));
  return projects.map(
    ({ assignment, id, student, submitted_at: submittedAt, ...project }) => ({
      analysisStatus: project.analysis_status,
      assignment,
      id,
      metrics: submissionMetrics(project),
      student,
      submittedAt,
    })
  );
};

export type CohortRows = Awaited<ReturnType<typeof readCohortMetrics>>;

const CHECK_RESULT_COLUMNS =
  "final_version_id, analysis_version, iteration_id, model, rubric_version, created_at, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty";

const FLAG_COLUMNS =
  "id, kind, evidence, explanation, review_state, review_note, reviewed_at, flag_reviews(review_state, reviewed_at, note)";

const SUBMISSION_COLUMNS =
  `id, submitted_at, analysis_status, analysis_version, analysis_error, analysis_started_at, analysis_finished_at, assignment:assignments(id, title, course:courses(id, code, title)), student:enrolments(email, profile:profiles(display_name)), iterations(id, step_number, prompt, raw_answer, critique, marks, student_marked_ai_error, ai_error_evidence, created_at), final_versions(id, version_number, extracted_text, original_filename), analysis_results(${CHECK_RESULT_COLUMNS}, flags(${FLAG_COLUMNS})), grader_notes(iteration_id, body)` as const;

const readSubmission = async (
  client: Client,
  userId: string,
  projectId: string
) => {
  const { data, error } = await client
    .from("projects")
    .select(SUBMISSION_COLUMNS)
    .eq("id", projectId)
    .eq("status", "submitted")
    .eq("final_versions.is_current", true)
    .eq("grader_notes.author_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error("Unable to load the submission.", { cause: error });
  }
  return data;
};

export type SubmissionProject = NonNullable<
  Awaited<ReturnType<typeof readSubmission>>
>;

const readFlagBatch = async (client: Client, from: number) =>
  unwrap(
    await client
      .from("projects")
      .select(
        `id, submitted_at, assignment:assignments(id, title, course:courses(id, code, title)), student:enrolments(email, profile:profiles(display_name)), iterations(id, step_number, prompt, critique), final_versions(id, version_number), analysis_results(${CHECK_RESULT_COLUMNS}, flags(${FLAG_COLUMNS}))`
      )
      .eq("status", "submitted")
      .eq("final_versions.is_current", true)
      .order("submitted_at", { ascending: false })
      .order("id")
      .range(from, from + COHORT_BATCH - 1),
    "the flags"
  );

const readFlagQueue = (client: Client) =>
  inBatches((from) => readFlagBatch(client, from));

export type FlagQueueRows = Awaited<ReturnType<typeof readFlagQueue>>;

const readUnresolvedBatch = async (client: Client, from: number) =>
  unwrap(
    await client
      .from("projects")
      .select(
        "final_versions(id), analysis_results(final_version_id, analysis_version, created_at, flags(kind, review_state))"
      )
      .eq("status", "submitted")
      .eq("final_versions.is_current", true)
      .order("id")
      .range(from, from + COHORT_BATCH - 1),
    "the open flags"
  );

const readUnresolvedFlags = (client: Client) =>
  inBatches((from) => readUnresolvedBatch(client, from));

export type UnresolvedRows = Awaited<ReturnType<typeof readUnresolvedFlags>>;

const readReviews = async (client: Client, projectId: string) =>
  unwrap(
    await client
      .from("analysis_results")
      .select(
        "id, iteration_id, analysis_version, model, rubric_version, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty, created_at, flags(id, kind, evidence, explanation, review_state, review_note, reviewed_by, reviewed_at, flag_reviews(id, review_state, reviewer_id, reviewed_at, note))"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    "reviews"
  );

export const assignmentsQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readAssignments),
  queryKey: queryKeys.assignments(userId),
});

export const coursesQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readCourses),
  queryKey: queryKeys.courses(userId),
});

export const projectLogQuery = (
  client: Client,
  userId: string,
  projectId: string
) => ({
  queryFn: () =>
    asUser(client, userId, (scoped) => readProjectLog(scoped, projectId)),
  queryKey: queryKeys.projectLog(userId, projectId),
});

export const submissionsQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readSubmissions),
  queryKey: queryKeys.submissions(userId),
});

export const projectMetricsQuery = (
  client: Client,
  userId: string,
  projectId: string
) => ({
  queryFn: () =>
    asUser(client, userId, (scoped) => readProjectMetrics(scoped, projectId)),
  queryKey: queryKeys.metrics(userId, projectId),
});

export const cohortMetricsQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readCohortMetrics),
  queryKey: queryKeys.cohortMetrics(userId),
});

export const submissionQuery = (
  client: Client,
  userId: string,
  projectId: string
) => ({
  queryFn: () =>
    asUser(client, userId, (scoped) =>
      readSubmission(scoped, userId, projectId)
    ),
  queryKey: queryKeys.submission(userId, projectId),
});

export const reviewsQuery = (
  client: Client,
  userId: string,
  projectId: string
) => ({
  queryFn: () =>
    asUser(client, userId, (scoped) => readReviews(scoped, projectId)),
  queryKey: queryKeys.reviews(userId, projectId),
});

export const flagQueueQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readFlagQueue),
  queryKey: queryKeys.flagQueue(userId),
});

export const unresolvedFlagsQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readUnresolvedFlags),
  queryKey: queryKeys.unresolvedFlags(userId),
});

const invalidate = (queryClient: QueryClient, ...keys: QueryKey[]) =>
  Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );

export const invalidateAfterOpen = (queryClient: QueryClient, userId: string) =>
  invalidate(queryClient, queryKeys.assignments(userId));

export const invalidateAfterSave = (
  queryClient: QueryClient,
  userId: string,
  projectId: string
) =>
  invalidate(
    queryClient,
    queryKeys.project(userId, projectId),
    queryKeys.assignments(userId)
  );

export const cacheSavedFinal = (
  queryClient: QueryClient,
  userId: string,
  projectId: string,
  saved: ProjectLog["final_versions"][number]
) => {
  queryClient.setQueryData<ProjectLog>(
    queryKeys.projectLog(userId, projectId),
    (log) => log && { ...log, final_versions: [saved] }
  );
  return invalidate(queryClient, queryKeys.metrics(userId, projectId));
};

export const invalidateAfterSubmit = (
  queryClient: QueryClient,
  userId: string,
  projectId: string
) =>
  invalidate(
    queryClient,
    queryKeys.project(userId, projectId),
    queryKeys.assignments(userId),
    queryKeys.submissions(userId)
  );

export const invalidateAfterSetup = (
  queryClient: QueryClient,
  userId: string
) => invalidate(queryClient, queryKeys.courses(userId));

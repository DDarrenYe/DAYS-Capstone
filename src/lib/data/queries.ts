import type {
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { QueryClient, QueryKey } from "@tanstack/query-core";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export const queryKeys = {
  assignments: (userId: string) => ["users", userId, "assignments"] as const,
  project: (userId: string, projectId: string) =>
    ["users", userId, "projects", projectId] as const,
  projectLog: (userId: string, projectId: string) =>
    [...queryKeys.project(userId, projectId), "log"] as const,
  reviews: (userId: string, projectId: string) =>
    [...queryKeys.project(userId, projectId), "reviews"] as const,
  submissions: (userId: string) => ["users", userId, "submissions"] as const,
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

const readProjectLog = async (client: Client, projectId: string) =>
  unwrap(
    await client
      .from("projects")
      .select(
        "id, assignment_id, status, submitted_at, iterations(id, step_number, ai_tool, prompt, raw_answer, critique, student_marked_ai_error, ai_error_evidence, created_at)"
      )
      .eq("id", projectId)
      .order("step_number", { referencedTable: "iterations" })
      .maybeSingle(),
    "the project log"
  );

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

const readReviews = async (client: Client, projectId: string) =>
  unwrap(
    await client
      .from("analysis_results")
      .select(
        "id, iteration_id, analysis_version, model, rubric_version, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty, created_at, flags(id, kind, evidence, explanation, review_state, reviewed_by, reviewed_at, flag_reviews(id, review_state, reviewer_id, reviewed_at))"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    "reviews"
  );

export const assignmentsQuery = (client: Client, userId: string) => ({
  queryFn: () => asUser(client, userId, readAssignments),
  queryKey: queryKeys.assignments(userId),
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

export const reviewsQuery = (
  client: Client,
  userId: string,
  projectId: string
) => ({
  queryFn: () =>
    asUser(client, userId, (scoped) => readReviews(scoped, projectId)),
  queryKey: queryKeys.reviews(userId, projectId),
});

const invalidate = (queryClient: QueryClient, ...keys: QueryKey[]) =>
  Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );

export const invalidateAfterStart = (
  queryClient: QueryClient,
  userId: string
) => invalidate(queryClient, queryKeys.assignments(userId));

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

export const invalidateAfterReview = (
  queryClient: QueryClient,
  userId: string,
  projectId: string
) =>
  invalidate(
    queryClient,
    queryKeys.project(userId, projectId),
    queryKeys.submissions(userId)
  );

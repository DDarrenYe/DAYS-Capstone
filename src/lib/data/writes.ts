import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { flagReviewState } from "@/db/schema";
import {
  MAX_TEXT,
  assignmentSchema,
  courseSchema,
  enrolSchema,
  removeEnrolmentSchema,
} from "@/lib/data/schemas";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

const MAX_STEP_NUMBER = 2_147_483_647;
const UNIQUE_VIOLATION = "23505";

const text = z
  .string()
  .max(MAX_TEXT)
  .refine((value) => value.trim() !== "");

const stepSchema = z.object({
  aiErrorEvidence: text.nullish(),
  aiTool: text,
  critique: text.nullish(),
  id: z.guid().optional(),
  projectId: z.guid(),
  prompt: text,
  rawAnswer: text,
  stepNumber: z.int().min(1).max(MAX_STEP_NUMBER),
});
const openSchema = z.object({ assignmentId: z.guid() });
const submitSchema = z.object({ projectId: z.guid() });
const reviewSchema = z.object({
  flagId: z.guid(),
  state: z.enum(flagReviewState.enumValues),
});

export type StepInput = z.input<typeof stepSchema>;
export type OpenInput = z.input<typeof openSchema>;
export type SubmitInput = z.input<typeof submitSchema>;
export type ReviewInput = z.input<typeof reviewSchema>;
export type CourseInput = z.input<typeof courseSchema>;
export type AssignmentInput = z.input<typeof assignmentSchema>;
export type EnrolInput = z.input<typeof enrolSchema>;
export type RemoveEnrolmentInput = z.input<typeof removeEnrolmentSchema>;

export interface WriteResult {
  error?: string;
  field?: string;
}

export interface EnrolResult extends WriteResult {
  results?: { address: string; outcome: string }[];
}

const invalidInput: WriteResult = { error: "Check the details and try again." };
export const forbidden: WriteResult = { error: "You can't make that change." };

const failure = (error: PostgrestError, duplicate?: string): WriteResult => {
  if (error.code === "42501" || error.code === "23514") {
    return forbidden;
  }
  if (error.code === UNIQUE_VIOLATION && duplicate) {
    return { error: duplicate };
  }
  console.error("Database write failed", error);
  return { error: "Unable to save. Try again shortly." };
};

const settle = (
  row: { id: string } | null,
  error: PostgrestError | null
): WriteResult => {
  if (error) {
    return failure(error, "That step number is already used.");
  }
  return row ? {} : forbidden;
};

export const writeStep = async (
  client: Client,
  input: StepInput
): Promise<WriteResult> => {
  const { data: step, success } = stepSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const evidence = step.aiErrorEvidence ?? null;
  const fields = {
    ai_error_evidence: evidence,
    ai_tool: step.aiTool,
    critique: step.critique ?? null,
    prompt: step.prompt,
    raw_answer: step.rawAnswer,
    step_number: step.stepNumber,
    student_marked_ai_error: evidence !== null,
  };
  const { data, error } = step.id
    ? await client
        .from("iterations")
        .update(fields)
        .eq("id", step.id)
        .eq("project_id", step.projectId)
        .select("id")
        .maybeSingle()
    : await client
        .from("iterations")
        .insert({ ...fields, project_id: step.projectId })
        .select("id")
        .maybeSingle();
  return settle(data, error);
};

export const writeProject = async (
  client: Client,
  studentId: string,
  input: OpenInput
): Promise<WriteResult> => {
  const { data: open, success } = openSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data: assignment, error: readError } = await client
    .from("assignments")
    .select("id, course_id")
    .eq("id", open.assignmentId)
    .maybeSingle();
  if (readError || !assignment) {
    return settle(null, readError);
  }
  const { error } = await client.from("projects").insert({
    assignment_id: assignment.id,
    course_id: assignment.course_id,
    student_id: studentId,
  });
  return error?.code === UNIQUE_VIOLATION ? {} : settle(assignment, error);
};

export const writeSubmission = async (
  client: Client,
  input: SubmitInput
): Promise<WriteResult> => {
  const { data: submission, success } = submitSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client
    .from("projects")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submission.projectId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  return settle(data, error);
};

export const writeReview = async (
  client: Client,
  reviewerId: string,
  input: ReviewInput
): Promise<WriteResult> => {
  const { data: review, success } = reviewSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client
    .from("flags")
    .update({
      review_state: review.state,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", review.flagId)
    .select("id")
    .maybeSingle();
  return settle(data, error);
};

export const writeCourse = async (
  client: Client,
  instructorId: string,
  input: CourseInput
): Promise<WriteResult> => {
  const { data: course, success } = courseSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { error } = await client.from("courses").insert({
    code: course.code,
    instructor_id: instructorId,
    title: course.title,
  });
  if (error?.code === UNIQUE_VIOLATION) {
    return {
      error: "You already have a course with that code.",
      field: "code",
    };
  }
  return error ? failure(error) : {};
};

export const writeAssignment = async (
  client: Client,
  input: AssignmentInput
): Promise<WriteResult> => {
  const { data: assignment, success } = assignmentSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { error } = await client.from("assignments").insert({
    brief: assignment.brief,
    course_id: assignment.courseId,
    due_at: assignment.dueAt ?? null,
    lane: assignment.lane,
    title: assignment.title,
  });
  return error ? failure(error) : {};
};

export const writeEnrolments = async (
  client: Client,
  input: EnrolInput
): Promise<EnrolResult> => {
  const { data: enrolment, success } = enrolSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client.rpc("enrol_students", {
    course: enrolment.courseId,
    emails: enrolment.emails,
  });
  return error ? failure(error) : { results: data };
};

export const removeEnrolment = async (
  client: Client,
  input: RemoveEnrolmentInput
): Promise<WriteResult> => {
  const { data: removal, success } = removeEnrolmentSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client
    .from("enrolments")
    .delete()
    .eq("id", removal.enrolmentId)
    .select("id")
    .maybeSingle();
  if (error?.code === "23503") {
    return {
      error: "That student has started work, so they can't be removed.",
    };
  }
  if (error) {
    return failure(error);
  }
  return data ? {} : forbidden;
};

import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { flagReviewState } from "@/db/schema";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

const MAX_TEXT = 50_000;
const MAX_STEP_NUMBER = 2_147_483_647;

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
const submitSchema = z.object({ projectId: z.guid() });
const startSchema = z.object({ assignmentId: z.guid() });
const reviewSchema = z.object({
  flagId: z.guid(),
  state: z.enum(flagReviewState.enumValues),
});

export type StepInput = z.input<typeof stepSchema>;
export type SubmitInput = z.input<typeof submitSchema>;
export type StartInput = z.input<typeof startSchema>;
export type ReviewInput = z.input<typeof reviewSchema>;

export interface WriteResult {
  error?: string;
}

const invalidInput: WriteResult = { error: "Check the details and try again." };
export const forbidden: WriteResult = { error: "You can't make that change." };

const fail = (error: PostgrestError): WriteResult => {
  if (error.code === "42501" || error.code === "23514") {
    return forbidden;
  }
  if (error.code === "23505") {
    return { error: "That step number is already used." };
  }
  console.error("Database write failed", error);
  return { error: "Unable to save. Try again shortly." };
};

const settle = (
  row: { id: string } | null,
  error: PostgrestError | null
): WriteResult => {
  if (error) {
    return fail(error);
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
  input: StartInput
): Promise<WriteResult> => {
  const { data: start, success } = startSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data: assignment, error: readError } = await client
    .from("assignments")
    .select("course_id")
    .eq("id", start.assignmentId)
    .maybeSingle();
  if (readError || !assignment) {
    return readError ? fail(readError) : forbidden;
  }
  const { error } = await client.from("projects").insert({
    assignment_id: start.assignmentId,
    course_id: assignment.course_id,
    student_id: studentId,
  });
  return !error || error.code === "23505" ? {} : fail(error);
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

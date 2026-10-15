import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { flagReviewState } from "@/db/schema";
import {
  MAX_NOTE,
  MAX_TEXT,
  assignmentSchema,
  courseSchema,
  enrolSchema,
  marksSchema,
  removeEnrolmentSchema,
} from "@/lib/data/schemas";
import { startAnalysis } from "@/lib/flagging/analysis";
import { DocxError, readDocument } from "@/lib/import/docx";
import { ImportError } from "@/lib/import/errors";
import { loadShare } from "@/lib/import/share";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";
const RAISE_EXCEPTION = "P0001";
const SERIALIZATION_FAILURE = "40001";
const IMPORT_TOOL = "ChatGPT";
const MAX_TOOL = 100;
const MAX_FILENAME = 255;
const MAX_QUOTE = 300;

const text = z
  .string()
  .max(MAX_TEXT)
  .refine((value) => value.trim() !== "");

const addStepSchema = z.object({
  aiTool: z.string().trim().min(1).max(MAX_TOOL),
  projectId: z.guid(),
  prompt: text,
  rawAnswer: text,
});
const previewSchema = z.object({
  projectId: z.guid(),
  url: z.string().max(2048),
});
const importSchema = previewSchema.extend({
  stepIds: z.array(z.string().max(200)).max(200).optional(),
});
const removeStepSchema = z.object({ projectId: z.guid(), stepId: z.guid() });
const critiqueSchema = z.object({
  critique: text,
  marks: marksSchema.default([]),
  projectId: z.guid(),
  stepId: z.guid(),
});
const saveFinalSchema = z.object({
  base: z.int().nonnegative(),
  filename: z.string().trim().min(1).max(MAX_FILENAME).nullable(),
  projectId: z.guid(),
  text: z.string().max(MAX_TEXT),
});
const openSchema = z.object({ assignmentId: z.guid() });
const projectSchema = z.object({ projectId: z.guid() });
const reviewSchema = z.object({
  flagId: z.guid(),
  note: z.string().max(MAX_NOTE).optional(),
  state: z.enum(flagReviewState.enumValues),
});
const noteSchema = z.object({
  body: z.string().max(MAX_NOTE),
  projectId: z.guid(),
  stepId: z.guid(),
});

export type AddStepInput = z.input<typeof addStepSchema>;
export type PreviewInput = z.input<typeof previewSchema>;
export type ImportInput = z.input<typeof importSchema>;
export type CritiqueInput = z.input<typeof critiqueSchema>;
export type RemoveStepInput = z.input<typeof removeStepSchema>;
export type SaveFinalInput = z.input<typeof saveFinalSchema>;
export type OpenInput = z.input<typeof openSchema>;
export type SubmitInput = z.input<typeof projectSchema>;
export type ReanalyseInput = SubmitInput;
export type ReviewInput = z.input<typeof reviewSchema>;
export type NoteInput = z.input<typeof noteSchema>;
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

export interface StepsResult extends WriteResult {
  added?: number;
  firstStep?: number;
}

export interface FinalResult extends WriteResult {
  conflict?: boolean;
  createdAt?: string;
  id?: string;
  version?: number;
}

export interface DocumentResult extends WriteResult {
  filename?: string;
  text?: string;
}

export interface PreviewResult extends WriteResult {
  link?: string;
  omitted?: number;
  steps?: { id: string; prompt: string; answer: string; saved: boolean }[];
}

const invalidInput: WriteResult = { error: "Check the details and try again." };
export const forbidden: WriteResult = { error: "You can't make that change." };

const failure = (error: PostgrestError, duplicate?: string): WriteResult => {
  if (error.code === "42501" || error.code === "23514") {
    return forbidden;
  }
  if (error.code === RAISE_EXCEPTION) {
    return { error: error.message };
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
    return failure(error);
  }
  return row ? {} : forbidden;
};

const addSteps = async (
  client: Client,
  projectId: string,
  steps: Json
): Promise<StepsResult> => {
  const { data, error } = await client.rpc("add_steps", {
    project: projectId,
    steps,
  });
  if (error) {
    return failure(error, "Those steps are already in your log.");
  }
  return {
    added: data.length,
    firstStep:
      data.length > 0
        ? Math.min(...data.map((row) => row.step_number))
        : undefined,
  };
};

export const writeSteps = (
  client: Client,
  input: AddStepInput
): Promise<StepsResult> => {
  const { data: step, success } = addStepSchema.safeParse(input);
  if (!success) {
    return Promise.resolve(invalidInput);
  }
  return addSteps(client, step.projectId, [
    {
      ai_tool: step.aiTool,
      import_source: "pasted_text",
      prompt: step.prompt,
      raw_answer: step.rawAnswer,
    },
  ]);
};

const readShare = async (url: string, load: typeof loadShare) => {
  try {
    return { shared: await load(url) };
  } catch (error) {
    if (error instanceof ImportError) {
      return { failed: { error: error.message } };
    }
    throw error;
  }
};

export const readImport = async (
  client: Client,
  input: PreviewInput,
  load: typeof loadShare = loadShare
): Promise<PreviewResult> => {
  const { data: preview, success } = previewSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data: project, error: projectError } = await client
    .from("projects")
    .select("id")
    .eq("id", preview.projectId)
    .maybeSingle();
  if (projectError || !project) {
    return projectError ? failure(projectError) : forbidden;
  }
  const { shared, failed } = await readShare(preview.url, load);
  if (!shared) {
    return failed;
  }
  const { data: saved, error } = await client
    .from("iterations")
    .select("source_step_id")
    .eq("project_id", preview.projectId)
    .eq("ai_tool", IMPORT_TOOL)
    .eq("source_conversation_id", shared.link.id);
  if (error) {
    return failure(error);
  }
  const have = new Set(saved.map((row) => row.source_step_id));
  return {
    link: shared.link.url.href,
    omitted: shared.omitted,
    steps: shared.steps.map((step) => ({ ...step, saved: have.has(step.id) })),
  };
};

export const writeImport = async (
  client: Client,
  input: ImportInput,
  load: typeof loadShare = loadShare
): Promise<StepsResult> => {
  const { data: request, success } = importSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { shared, failed } = await readShare(request.url, load);
  if (!shared) {
    return failed;
  }
  const chosen = request.stepIds && new Set(request.stepIds);
  const steps = shared.steps
    .filter(({ id }) => !chosen || chosen.has(id))
    .map((step) => ({
      ai_tool: IMPORT_TOOL,
      import_source: "public_link",
      prompt: step.prompt,
      raw_answer: step.answer,
      source_conversation_id: shared.link.id,
      source_step_id: step.id,
      source_url: shared.link.url.href,
    }));
  if (steps.length === 0) {
    return { error: "Choose at least one step to add." };
  }
  return addSteps(client, request.projectId, steps);
};

const quote = (passage: string) => {
  const flat = passage.trim().replaceAll(/\s+/gu, " ");
  return flat.length > MAX_QUOTE ? `${flat.slice(0, MAX_QUOTE)}…` : flat;
};

export const writeCritique = async (
  client: Client,
  input: CritiqueInput
): Promise<WriteResult> => {
  const { data: saved, success } = critiqueSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data: step, error: readError } = await client
    .from("iterations")
    .select("raw_answer")
    .eq("id", saved.stepId)
    .eq("project_id", saved.projectId)
    .maybeSingle();
  if (readError || !step) {
    return readError ? failure(readError) : forbidden;
  }
  if (saved.marks.some(({ end }) => end > step.raw_answer.length)) {
    return invalidInput;
  }
  const errors = saved.marks.filter(({ kind }) => kind === "wrong");
  const evidence =
    errors.length > 0
      ? errors
          .map(
            ({ start, end, note }) =>
              `“${quote(step.raw_answer.slice(start, end))}” — ${note?.trim()}`
          )
          .join("\n\n")
      : null;
  const { data, error } = await client
    .from("iterations")
    .update({
      ai_error_evidence: evidence,
      critique: saved.critique,
      marks: saved.marks,
      student_marked_ai_error: evidence !== null,
    })
    .eq("id", saved.stepId)
    .eq("project_id", saved.projectId)
    .select("id")
    .maybeSingle();
  return settle(data, error);
};

export const readFinalDocument = async (
  form: FormData
): Promise<DocumentResult> => {
  const file = form.get("file");
  if (!(file instanceof File)) {
    return invalidInput;
  }
  try {
    return await readDocument(file);
  } catch (error) {
    if (error instanceof DocxError) {
      return { error: error.message };
    }
    throw error;
  }
};

export const writeFinal = async (
  client: Client,
  input: SaveFinalInput
): Promise<FinalResult> => {
  const { data: final, success } = saveFinalSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client.rpc("save_final_version", {
    base: final.base,
    body: final.text,
    filename: final.filename ?? undefined,
    project: final.projectId,
  });
  if (error?.code === SERIALIZATION_FAILURE) {
    return {
      conflict: true,
      error: "Your final version was changed somewhere else.",
    };
  }
  if (error) {
    return failure(error);
  }
  const [saved] = data;
  return saved
    ? {
        createdAt: saved.created_at,
        id: saved.id,
        version: saved.version_number,
      }
    : forbidden;
};

export const removeStep = async (
  client: Client,
  input: RemoveStepInput
): Promise<WriteResult> => {
  const { data: removal, success } = removeStepSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { error } = await client.rpc("remove_step", {
    project: removal.projectId,
    step: removal.stepId,
  });
  return error ? failure(error) : {};
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
  input: SubmitInput,
  start: typeof startAnalysis = startAnalysis
): Promise<WriteResult> => {
  const { data: submission, success } = projectSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { error: submitError } = await client.rpc("submit_project", {
    project: submission.projectId,
  });
  if (submitError) {
    return failure(submitError);
  }
  try {
    await start(submission.projectId, false);
  } catch (error) {
    console.error("Unable to start the reflection check", error);
  }
  return {};
};

export const writeReanalysis = async (
  client: Client,
  input: ReanalyseInput,
  start: typeof startAnalysis = startAnalysis
): Promise<WriteResult> => {
  const { data: request, success } = projectSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data: project, error: readError } = await client
    .from("projects")
    .select("id")
    .eq("id", request.projectId)
    .eq("status", "submitted")
    .maybeSingle();
  if (readError || !project) {
    return readError ? failure(readError) : forbidden;
  }
  try {
    await start(project.id, true);
  } catch (error) {
    console.error("Unable to start the reflection check", error);
    return { error: "Unable to start the check. Try again shortly." };
  }
  return {};
};

/* The database records who decided and when, from the session, and ignores a repeat of the same decision. */
export const writeReview = async (
  client: Client,
  input: ReviewInput
): Promise<WriteResult> => {
  const { data: review, success } = reviewSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { data, error } = await client.rpc("review_flag", {
    decision: review.state,
    flag: review.flagId,
    note: review.note,
  });
  if (error) {
    return failure(error);
  }
  return data ? {} : forbidden;
};

export const writeNote = async (
  client: Client,
  authorId: string,
  input: NoteInput
): Promise<WriteResult> => {
  const { data: note, success } = noteSchema.safeParse(input);
  if (!success) {
    return invalidInput;
  }
  const { projectId, stepId } = note;
  const body = note.body.trim();
  if (body === "") {
    const { error } = await client
      .from("grader_notes")
      .delete()
      .eq("project_id", projectId)
      .eq("iteration_id", stepId)
      .eq("author_id", authorId);
    return error ? failure(error) : {};
  }
  const save = async (retry: boolean): Promise<WriteResult> => {
    const { data, error } = await client
      .from("grader_notes")
      .update({ body })
      .eq("project_id", projectId)
      .eq("iteration_id", stepId)
      .eq("author_id", authorId)
      .select("id")
      .maybeSingle();
    if (error || data) {
      return settle(data, error);
    }
    const { error: insertError } = await client.from("grader_notes").insert({
      author_id: authorId,
      body,
      iteration_id: stepId,
      project_id: projectId,
    });
    if (insertError?.code === UNIQUE_VIOLATION && retry) {
      return save(false);
    }
    return insertError ? failure(insertError) : {};
  };
  return save(true);
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

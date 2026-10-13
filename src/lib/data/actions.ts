"use server";

import { getAccount } from "@/lib/auth";
import {
  forbidden,
  removeEnrolment,
  writeAssignment,
  writeCourse,
  writeEnrolments,
  readImport,
  removeStep,
  writeCritique,
  writeImport,
  writeProject,
  writeReview,
  writeSteps,
  writeSubmission,
} from "@/lib/data/writes";
import type {
  AddStepInput,
  AssignmentInput,
  CourseInput,
  CritiqueInput,
  EnrolInput,
  EnrolResult,
  ImportInput,
  PreviewInput,
  PreviewResult,
  RemoveEnrolmentInput,
  RemoveStepInput,
  OpenInput,
  ReviewInput,
  StepsResult,
  SubmitInput,
  WriteResult,
} from "@/lib/data/writes";
import { createClient } from "@/lib/supabase/server";

export const openProject = async (input: OpenInput): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeProject(await createClient(), account.id, input);
};

export const addStep = async (input: AddStepInput): Promise<StepsResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeSteps(await createClient(), input);
};

export const previewImport = async (
  input: PreviewInput
): Promise<PreviewResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return readImport(await createClient(), input);
};

export const importSteps = async (input: ImportInput): Promise<StepsResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeImport(await createClient(), input);
};

export const saveCritique = async (
  input: CritiqueInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeCritique(await createClient(), input);
};

export const deleteStep = async (
  input: RemoveStepInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return removeStep(await createClient(), input);
};

export const submitProject = async (
  input: SubmitInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeSubmission(await createClient(), input);
};

export const reviewFlag = async (input: ReviewInput): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "instructor") {
    return forbidden;
  }
  return writeReview(await createClient(), account.id, input);
};

export const createCourse = async (
  input: CourseInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "instructor") {
    return forbidden;
  }
  return writeCourse(await createClient(), account.id, input);
};

export const createAssignment = async (
  input: AssignmentInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "instructor") {
    return forbidden;
  }
  return writeAssignment(await createClient(), input);
};

export const enrolStudents = async (
  input: EnrolInput
): Promise<EnrolResult> => {
  const account = await getAccount();
  if (account?.role !== "instructor") {
    return forbidden;
  }
  return writeEnrolments(await createClient(), input);
};

export const removeStudent = async (
  input: RemoveEnrolmentInput
): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "instructor") {
    return forbidden;
  }
  return removeEnrolment(await createClient(), input);
};

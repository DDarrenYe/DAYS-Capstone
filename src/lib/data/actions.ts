"use server";

import { getAccount } from "@/lib/auth";
import {
  forbidden,
  writeAssignment,
  writeCourse,
  writeEnrolments,
  writeReview,
  writeStep,
  writeSubmission,
} from "@/lib/data/writes";
import type {
  AssignmentInput,
  CourseInput,
  EnrolInput,
  EnrolResult,
  ReviewInput,
  StepInput,
  SubmitInput,
  WriteResult,
} from "@/lib/data/writes";
import { createClient } from "@/lib/supabase/server";

export const saveStep = async (input: StepInput): Promise<WriteResult> => {
  const account = await getAccount();
  if (account?.role !== "student") {
    return forbidden;
  }
  return writeStep(await createClient(), input);
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

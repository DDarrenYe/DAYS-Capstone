"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createAssignment,
  createCourse,
  enrolStudents,
  openProject,
  removeStudent,
  reviewFlag,
  saveStep,
  submitProject,
} from "@/lib/data/actions";
import {
  invalidateAfterOpen,
  invalidateAfterReview,
  invalidateAfterSave,
  invalidateAfterSetup,
  invalidateAfterSubmit,
} from "@/lib/data/queries";
import type {
  AssignmentInput,
  CourseInput,
  EnrolInput,
  OpenInput,
  RemoveEnrolmentInput,
  ReviewInput,
  StepInput,
  SubmitInput,
  WriteResult,
} from "@/lib/data/writes";

export class WriteError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "WriteError";
    this.field = field;
  }
}

const succeeded = async (pending: Promise<WriteResult>) => {
  const { error, field } = await pending;
  if (error) {
    throw new WriteError(error, field);
  }
};

export const useOpenProject = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenInput) => succeeded(openProject(input)),
    onSuccess: () => invalidateAfterOpen(queryClient, userId),
  });
};

export const useSaveStep = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StepInput) => succeeded(saveStep(input)),
    onSuccess: (_result, { projectId }) =>
      invalidateAfterSave(queryClient, userId, projectId),
  });
};

export const useSubmitProject = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitInput) => succeeded(submitProject(input)),
    onSuccess: (_result, { projectId }) =>
      invalidateAfterSubmit(queryClient, userId, projectId),
  });
};

export const useReviewFlag = (userId: string, projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => succeeded(reviewFlag(input)),
    onSuccess: () => invalidateAfterReview(queryClient, userId, projectId),
  });
};

export const useCreateCourse = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) => succeeded(createCourse(input)),
    onSuccess: () => invalidateAfterSetup(queryClient, userId),
  });
};

export const useCreateAssignment = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentInput) => succeeded(createAssignment(input)),
    onSuccess: () => invalidateAfterSetup(queryClient, userId),
  });
};

export const useEnrolStudents = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnrolInput) => {
      const { error, field, results } = await enrolStudents(input);
      if (error || !results) {
        throw new WriteError(
          error ?? "Unable to save. Try again shortly.",
          field
        );
      }
      return results;
    },
    onSuccess: () => invalidateAfterSetup(queryClient, userId),
  });
};

export const useRemoveStudent = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoveEnrolmentInput) =>
      succeeded(removeStudent(input)),
    onSuccess: () => invalidateAfterSetup(queryClient, userId),
  });
};

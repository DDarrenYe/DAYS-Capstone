"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addStep,
  createAssignment,
  createCourse,
  deleteStep,
  enrolStudents,
  importSteps,
  openProject,
  previewImport,
  removeStudent,
  reviewFlag,
  saveCritique,
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
  AddStepInput,
  AssignmentInput,
  CourseInput,
  CritiqueInput,
  EnrolInput,
  ImportInput,
  OpenInput,
  PreviewInput,
  RemoveEnrolmentInput,
  RemoveStepInput,
  ReviewInput,
  StepsResult,
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

const stepsAdded = async (pending: Promise<StepsResult>) => {
  const { error, field, added, firstStep } = await pending;
  if (error) {
    throw new WriteError(error, field);
  }
  return { added: added ?? 0, firstStep };
};

export const useAddStep = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddStepInput) => stepsAdded(addStep(input)),
    onSuccess: (_result, { projectId }) =>
      invalidateAfterSave(queryClient, userId, projectId),
  });
};

export const usePreviewImport = () =>
  useMutation({
    mutationFn: async (input: PreviewInput) => {
      const { error, field, link, omitted, steps } = await previewImport(input);
      if (error || !link || !steps) {
        throw new WriteError(error ?? "Unable to read that link.", field);
      }
      return { link, omitted: omitted ?? 0, steps };
    },
  });

export const useImportSteps = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportInput) => stepsAdded(importSteps(input)),
    onSuccess: (_result, { projectId }) =>
      invalidateAfterSave(queryClient, userId, projectId),
  });
};

export const useSaveCritique = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CritiqueInput) => succeeded(saveCritique(input)),
    onSuccess: (_result, { projectId }) =>
      invalidateAfterSave(queryClient, userId, projectId),
  });
};

export const useDeleteStep = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoveStepInput) => succeeded(deleteStep(input)),
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

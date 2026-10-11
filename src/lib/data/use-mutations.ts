"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  openProject,
  reviewFlag,
  saveStep,
  submitProject,
} from "@/lib/data/actions";
import {
  invalidateAfterOpen,
  invalidateAfterReview,
  invalidateAfterSave,
  invalidateAfterSubmit,
} from "@/lib/data/queries";
import type {
  OpenInput,
  ReviewInput,
  StepInput,
  SubmitInput,
  WriteResult,
} from "@/lib/data/writes";

const succeeded = async (pending: Promise<WriteResult>) => {
  const { error } = await pending;
  if (error) {
    throw new Error(error);
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

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addStep,
  createAssignment,
  createCourse,
  deleteStep,
  enrolStudents,
  extractFinal,
  importSteps,
  openProject,
  previewImport,
  removeStudent,
  reviewFlag,
  saveCritique,
  saveFinal,
  saveNote,
  submitProject,
} from "@/lib/data/actions";
import {
  cacheSavedFinal,
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
  NoteInput,
  OpenInput,
  PreviewInput,
  RemoveEnrolmentInput,
  RemoveStepInput,
  ReviewInput,
  SaveFinalInput,
  StepsResult,
  SubmitInput,
  WriteResult,
} from "@/lib/data/writes";

export class WriteError extends Error {
  field?: string;
  conflict: boolean;

  constructor(message: string, field?: string, conflict = false) {
    super(message);
    this.name = "WriteError";
    this.field = field;
    this.conflict = conflict;
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

export const useSaveFinal = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveFinalInput) => {
      const { conflict, createdAt, error, id, version } =
        await saveFinal(input);
      if (error || !(createdAt && id && version)) {
        throw new WriteError(
          error ?? "Unable to save. Try again shortly.",
          undefined,
          conflict
        );
      }
      return { createdAt, id, version };
    },
    onError: (error, { projectId }) =>
      error instanceof WriteError && error.conflict
        ? invalidateAfterSave(queryClient, userId, projectId)
        : undefined,
    onSuccess: ({ createdAt, id, version }, input) =>
      cacheSavedFinal(queryClient, userId, input.projectId, {
        created_at: createdAt,
        extracted_text: input.text,
        id,
        original_filename: input.filename,
        version_number: version,
      }),
  });
};

export const useExtractFinal = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      const { error, filename, text } = await extractFinal(form);
      if (error || text === undefined || !filename) {
        throw new WriteError(error ?? "Unable to read that document.");
      }
      return { filename, text };
    },
  });

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

export const useSaveNote = () =>
  useMutation({ mutationFn: (input: NoteInput) => succeeded(saveNote(input)) });

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

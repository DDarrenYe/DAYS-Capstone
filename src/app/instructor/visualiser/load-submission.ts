import { z } from "zod";

import { submissionDetail } from "@/app/instructor/visualiser/submission-detail";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { requireRole } from "@/lib/auth";
import { submissionQuery } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

type Loaded =
  | { detail: SubmissionDetail; problem?: undefined }
  | { detail?: undefined; problem: "empty" | "missing" | "none" };

export const loadSubmission = async (
  searchParams: Promise<Record<string, string | string[] | undefined>>
): Promise<Loaded> => {
  const { project } = await searchParams;
  const { id } = await requireRole("instructor");
  const projectId = z.guid().safeParse(project);
  if (!projectId.success) {
    return { problem: "none" };
  }
  const found = await submissionQuery(
    await createClient(),
    id,
    projectId.data
  ).queryFn();
  if (!found) {
    return { problem: "missing" };
  }
  const detail = submissionDetail(found);
  return detail.steps.length === 0 ? { problem: "empty" } : { detail };
};

import { z } from "zod";

import { stepsCsv } from "@/app/instructor/reports/export/csv";
import { renderReport } from "@/app/instructor/reports/export/report";
import { submissionDetail } from "@/app/instructor/visualiser/submission-detail";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import type { SubmissionProject } from "@/lib/data/queries";
import { exportQuerySchema } from "@/lib/export-options";

interface Account {
  id: string;
  role: "student" | "instructor";
}

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

const refuse = (status: number, message: string) =>
  new Response(message, {
    headers: { ...HEADERS, "Content-Type": "text/plain; charset=utf-8" },
    status,
  });

const slug = (value: string) =>
  value
    .normalize("NFKD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");

export const fileBase = ({ assignment, name }: SubmissionDetail) =>
  [slug(name), slug(assignment.title)].filter(Boolean).join("-") || "report";

const file = (body: BodyInit, name: string, type: string) =>
  new Response(body, {
    headers: {
      ...HEADERS,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Type": type,
    },
  });

export const exportResponse = async ({
  account,
  generated = new Date(),
  load,
  params,
}: {
  account: Account | null;
  generated?: Date;
  load: (
    accountId: string,
    projectId: string
  ) => Promise<SubmissionProject | null>;
  params: URLSearchParams;
}) => {
  if (!account) {
    return refuse(401, "Sign in to export a report.");
  }
  if (account.role !== "instructor") {
    return refuse(403, "Only instructors can export reports.");
  }
  const query = exportQuerySchema.safeParse(Object.fromEntries(params));
  if (!query.success) {
    return refuse(400, z.prettifyError(query.error));
  }
  const { format, project, ...sections } = query.data;
  const found = await load(account.id, project);
  if (!found) {
    return refuse(
      404,
      "That submission doesn’t exist, or it isn’t in one of your courses."
    );
  }
  const detail = submissionDetail(found);
  const base = fileBase(detail);
  if (format === "csv") {
    return file(
      stepsCsv(detail, sections),
      `${base}.csv`,
      "text/csv; charset=utf-8"
    );
  }
  const pdf = await renderReport({ detail, generated, sections });
  return file(new Uint8Array(pdf), `${base}.pdf`, "application/pdf");
};

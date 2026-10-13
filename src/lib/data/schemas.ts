import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const MAX_TEXT = 50_000;
const MAX_LABEL = 200;
const MAX_EMAIL = 320;
const MAX_ENROLMENTS = 500;

const label = z
  .string()
  .trim()
  .min(1, "Required")
  .max(MAX_LABEL, `Use ${MAX_LABEL} characters or fewer`);

const lane = z.enum(["lane_1", "lane_2"]) satisfies z.ZodType<
  Database["public"]["Enums"]["assignment_lane"]
>;

const brief = z.string().max(MAX_TEXT, "Use 50,000 characters or fewer");

const MAX_NOTE = 2000;
const MAX_MARKS = 100;

export const markDraftSchema = z.object({
  end: z.int().positive(),
  kind: z.enum(["wrong", "unsourced", "used"]),
  note: z.string().max(MAX_NOTE).optional(),
  start: z.int().nonnegative(),
});

export const marksSchema = z
  .array(
    markDraftSchema
      .refine(({ start, end }) => end > start)
      .refine(
        ({ kind, note }) => kind !== "wrong" || (note ?? "").trim() !== ""
      )
  )
  .max(MAX_MARKS);

export const courseSchema = z.object({ code: label, title: label });

export const assignmentSchema = z.object({
  brief: brief.default(""),
  courseId: z.guid(),
  dueAt: z.iso.datetime({ offset: true }).nullish(),
  lane,
  title: label,
});

export const assignmentFormSchema = assignmentSchema
  .pick({ lane: true, title: true })
  .extend({ brief, dueAt: z.string() });

export const enrolSchema = z.object({
  courseId: z.guid(),
  emails: z
    .string()
    .max(MAX_TEXT, "Paste fewer addresses at a time")
    .transform((pasted) => pasted.split(/[\s,;]+/u).filter(Boolean))
    .pipe(
      z
        .array(
          z.string().max(MAX_EMAIL, `Addresses stop at ${MAX_EMAIL} characters`)
        )
        .min(1, "Paste at least one email address")
        .max(
          MAX_ENROLMENTS,
          `Paste up to ${MAX_ENROLMENTS} addresses at a time`
        )
    ),
});

export const enrolFormSchema = enrolSchema.pick({ emails: true });

export const removeEnrolmentSchema = z.object({ enrolmentId: z.guid() });

export type AssignmentFormValues = z.input<typeof assignmentFormSchema>;

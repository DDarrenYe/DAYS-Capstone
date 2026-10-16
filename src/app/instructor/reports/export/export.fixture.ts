import { submissionDetail } from "@/app/instructor/visualiser/submission-detail";
import type { SubmissionProject } from "@/lib/data/queries";
import { composeCritique } from "@/lib/process";

export const SHORT_ANSWER =
  "Photosynthesis converts light energy into chemical energy stored in glucose.";

export const UNICODE_ANSWER =
  "Kia ora, whānau. Tāmaki Makaurau, Ōtepoti and Whanganui-a-Tara: “mana whenua” — the people who hold authority over a place. Ελληνικά, Русский, Tiếng Việt, 日本語のテキスト.";

export const LONG_ANSWER = Array.from(
  { length: 90 },
  (_, index) =>
    `Sentence ${index + 1} explains how respiration releases the energy that glucose stores inside the mitochondria of a cell.`
).join(" ");

export const LONG_URL = `https://example.com/${"a-very-long-path-segment-".repeat(14)}end`;

const critique = (check: string, change = "I rewrote the second sentence") =>
  composeCritique({ change, check, sources: [], verdict: "partly" });

const flag = (
  id: string,
  state: "added_to_feedback" | "dismissed" | "open",
  note: string | null = null
) => ({
  evidence: "“Done.”",
  explanation: "The critique says too little.",
  flag_reviews: [],
  id,
  kind: "low_effort_reflection",
  review_note: note,
  review_state: state,
  reviewed_at: state === "open" ? null : "2026-10-14T03:00:00Z",
});

const check = (iterationId: string, flags: ReturnType<typeof flag>[]) => ({
  ai_correctness_addressed: true,
  ai_correctness_evidence: "Done.",
  analysis_version: "analysis-v1",
  changes_addressed: false,
  changes_evidence: "",
  created_at: "2026-10-14T01:04:00Z",
  explanation: "The critique gives a verdict and nothing else.",
  final_version_id: "final-1",
  flags,
  iteration_id: iterationId,
  model: "glm-test",
  rubric_version: "three-questions-v2",
  uncertainty: "A short critique may follow a discussion that was not logged.",
  verification_addressed: false,
  verification_evidence: "",
});

const iteration = (
  number: number,
  overrides: Partial<SubmissionProject["iterations"][number]>
): SubmissionProject["iterations"][number] => ({
  ai_error_evidence: null,
  created_at: `2026-10-0${number + 1}T06:02:00Z`,
  critique: critique(
    "I compared it with the textbook chapter on plant biology"
  ),
  id: `step-${number}`,
  marks: [],
  prompt: `Prompt ${number}`,
  raw_answer: SHORT_ANSWER,
  step_number: number,
  student_marked_ai_error: false,
  ...overrides,
});

export const project = (
  overrides: Partial<SubmissionProject> = {}
): SubmissionProject => ({
  analysis_error: null,
  analysis_finished_at: "2026-10-14T01:05:00Z",
  analysis_results: [
    check("step-2", [
      flag("flag-1", "open"),
      flag("flag-2", "dismissed", "Fine."),
    ]),
    check("step-4", [
      flag("flag-3", "added_to_feedback", "Raise in feedback."),
    ]),
  ],
  analysis_started_at: "2026-10-14T01:01:00Z",
  analysis_status: "completed",
  analysis_version: "analysis-v1",
  assignment: {
    course: { code: "INFOMGMT 399", id: "course-1", title: "Capstone" },
    id: "assignment-1",
    title: "Essay 2",
  },
  final_versions: [
    {
      extracted_text: `${SHORT_ANSWER} My own closing thought here.\n\n${UNICODE_ANSWER.split(".")[0]}. Then my own words about it.`,
      id: "final-1",
      original_filename: "essay.docx",
      version_number: 1,
    },
  ],
  grader_notes: [
    { body: "Check the cited source.", iteration_id: "step-2" },
    { body: "@SUM(A1:A2) is how they cite.", iteration_id: "step-4" },
  ],
  id: "project-1",
  iterations: [
    iteration(1, {}),
    iteration(2, {
      ai_error_evidence: "“mitochondria” — it is in the cytoplasm",
      critique: critique("Done."),
      marks: [
        {
          end: 13,
          kind: "wrong",
          note: "Not what the textbook says",
          start: 0,
        },
      ],
      prompt: "Explain respiration",
      raw_answer: "Photosynthesis converts light energy into glucose.",
      student_marked_ai_error: true,
    }),
    iteration(3, {
      critique: critique(
        `I read the tikanga chapter and checked ${LONG_URL} for the spelling.\nSecond line of the check.`,
        "Fixed the macrons"
      ),
      prompt: "Kia ora — explain “mana whenua” & whakapapa 😀",
      raw_answer: UNICODE_ANSWER,
    }),
    iteration(4, {
      critique: critique('=HYPERLINK("http://evil.example","click")'),
      prompt: "+1 and -2 and @cmd",
      raw_answer: LONG_ANSWER,
    }),
  ],
  student: {
    email: "student@example.com",
    profile: { display_name: "Māia O’Brien" },
  },
  submitted_at: "2026-10-14T01:00:00Z",
  ...overrides,
});

export const detail = (overrides: Partial<SubmissionProject> = {}) =>
  submissionDetail(project(overrides));

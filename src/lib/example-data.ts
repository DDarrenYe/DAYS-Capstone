/*
  Example content for the screens that are not connected to Supabase yet (#20, #21, #27–#30, #36).
  Every figure a screen shows is derived from these records, so the cohort, visualiser and report agree.
*/
import { summarise } from "@/lib/process";
import type { Step, StepFlag } from "@/lib/process";

const all = { change: true, check: true, verdict: true };

export const assignmentName = "Essay 2";
export const essayTitle = `${assignmentName} · Make the case for Lane 2`;

export const student = {
  file: "essay2-final.docx",
  finalWords: 1204,
  id: "s1203391",
  initials: "JD",
  name: "John Doe",
  submitted: "Fri 10 Oct, 16:42",
};

export const steps: Step[] = [
  {
    answer: [
      {
        text: "1. The rise of generative AI. 2. Assessment pressure on universities. 3. The two-lane model defined. 4. Why visibility matters. 5. Making process visible.",
      },
    ],
    answered: all,
    asked:
      "Give me an outline for an essay arguing that Lane 2 assessment only works if graders can see how students used AI.",
    carried: 0,
    critique:
      "A useful skeleton, but it defines the two lanes in section 3. A reader needs that first, so I moved it into the intro and merged 4 and 5, which said the same thing.",
    critiqueWords: 64,
    day: "Mon",
    depth: 2,
    time: "Mon 6 Oct · 19:02",
    title: "Outline the argument",
    words: 310,
  },
  {
    answer: [
      {
        text: "Liu & Bridgeman (2023), Teaching@Sydney, on the two-lane approach; and ",
      },
      {
        kind: "error",
        text: "Smith & Roberts (2022), Journal of Assessment Futures, 14(2)",
      },
      { text: ", on process-based marking." },
    ],
    answered: all,
    asked:
      "Find two academic sources that support the idea that process evidence matters in AI-permitted assessment.",
    carried: 0,
    caught: "Invented source",
    critique:
      "The second source does not exist. I searched Google Scholar and the publisher's site and found nothing. I replaced it with the University of Auckland's TeachWell guidance, which I read in full.",
    critiqueWords: 88,
    day: "Mon",
    depth: 3,
    time: "Mon 6 Oct · 19:40",
    title: "Find two sources",
    words: 420,
  },
  {
    answer: [
      {
        kind: "carried",
        text: "The two-lane model: secure, supervised assessment in Lane 1, and open use of AI in Lane 2, where students are marked on how they use it.",
      },
      {
        text: " It was introduced to respond to tools that can now produce fluent work instantly.",
      },
    ],
    answered: { change: false, check: true, verdict: true },
    asked:
      "Draft an opening paragraph that introduces the two-lane model in plain language.",
    carried: 150,
    critique:
      "Kept the definition because it is accurate and clear. Cut the second sentence; it repeats my first line.",
    critiqueWords: 52,
    day: "Tue",
    depth: 2,
    time: "Tue 7 Oct · 14:20",
    title: "Draft the intro",
    words: 260,
  },
  {
    answer: [
      { text: "The two-lane model, introduced in " },
      { kind: "error", text: "2019" },
      {
        text: ", separates secure assessment from open tasks where AI use is allowed.",
      },
    ],
    answered: all,
    asked:
      "When did Sydney introduce the two-lane approach, and who wrote about it?",
    carried: 0,
    caught: "Wrong date",
    critique:
      "Wrong date. Liu and Bridgeman's article is from 2023 and the approach was introduced that year. I checked the article itself and corrected my intro.",
    critiqueWords: 96,
    day: "Tue",
    depth: 3,
    time: "Tue 7 Oct · 14:51",
    title: "Check the facts",
    words: 180,
  },
  {
    answer: [
      {
        kind: "carried",
        text: "Most students already use AI tools every week, and staff report that raw chat logs are too long to read across a large cohort.",
      },
      { text: " Structured evidence could reduce this burden." },
    ],
    answered: { change: false, check: true, verdict: true },
    asked:
      "My second paragraph needs evidence about how students and staff experience AI logs. Suggest a stronger version.",
    carried: 130,
    critique:
      "The claim about staff matches what our lecturer said in week 4. I kept the first sentence and wrote the rest myself.",
    critiqueWords: 47,
    day: "Wed",
    depth: 2,
    time: "Wed 8 Oct · 10:05",
    title: "Strengthen paragraph 2",
    words: 290,
  },
  {
    answer: [
      {
        kind: "carried",
        text: "Ultimately, the two-lane model represents a transformative shift that empowers students to engage critically with emerging technologies while safeguarding academic integrity.",
      },
      { text: " Consider closing with a call to action for institutions." },
    ],
    answered: { change: false, check: false, verdict: false },
    asked: "Can you check my conclusion and make it sound more academic?",
    carried: 64,
    critique: "Looks good.",
    critiqueWords: 2,
    day: "Thu",
    depth: 0,
    flag: {
      body: "The critique is two words and describes no check. 64 words of this answer appear unchanged in the conclusion.",
      title: "Accepted without critique",
    },
    time: "Thu 9 Oct · 21:14",
    title: "Check the conclusion",
    words: 340,
  },
  {
    answer: [
      { text: "Yes, surveys consistently show that " },
      { kind: "error", text: "around 90% of students use AI tools" },
      { text: " for their assignments, with most reporting weekly use." },
    ],
    answered: all,
    asked: "Is it true that nine in ten students use AI for assignments?",
    carried: 0,
    caught: "Misquoted statistic",
    critique:
      "Not what the survey says. The 2025 Universities NZ survey reports 64% weekly use, and it does not say it is for assignments. I rewrote the sentence to say every week and cited the survey.",
    critiqueWords: 112,
    day: "Thu",
    depth: 3,
    time: "Thu 9 Oct · 21:32",
    title: "Fix a misquoted statistic",
    words: 220,
  },
  {
    answer: [
      {
        text: "Critics argue logs can be faked. Yet a log that names the error, the check and the change is far harder to fake than a reflection written the night before.",
      },
    ],
    answered: { change: true, check: false, verdict: false },
    asked: "Make paragraph 4 more concise.",
    carried: 0,
    critique: "Made it shorter, reads better.",
    critiqueWords: 5,
    day: "Fri",
    depth: 1,
    flag: {
      body: "The critique could describe any edit. It names no change and no reason, so it does not show evaluation.",
      title: "Generic critique",
    },
    time: "Fri 10 Oct · 15:10",
    title: "Tighten the wording",
    words: 160,
  },
  {
    answer: [
      {
        kind: "carried",
        text: "If universities want Lane 2 to mean something, they have to make the messy middle visible.",
      },
      { text: " The rest reads clearly." },
    ],
    answered: { change: true, check: false, verdict: true },
    asked: "Proofread my final paragraph for clarity.",
    carried: 40,
    critique:
      "Fixed two commas. I wrote the last line myself and the AI only shortened it, so I kept its version.",
    critiqueWords: 41,
    day: "Fri",
    depth: 2,
    time: "Fri 10 Oct · 16:20",
    title: "Final proofread",
    words: 120,
  },
];

/* The final essay, split into runs. A run with a step index matches that step's AI answer. */
export const essay: { text: string; step?: number }[][] = [
  [
    {
      text: "Generative AI now writes fluent essays in seconds, so universities can no longer out-design it. Sydney's answer, introduced in 2023, is ",
    },
    {
      step: 2,
      text: "the two-lane model: secure, supervised assessment in Lane 1, and open use of AI in Lane 2, where students are marked on how they use it.",
    },
  ],
  [
    {
      text: "This essay argues that Lane 2 only works if graders can see the thinking behind the work. A student who catches a source the AI invented is doing exactly the evaluation the model was designed to reward.",
    },
  ],
  [
    {
      step: 4,
      text: "Most students already use AI tools every week, and staff report that raw chat logs are too long to read across a large cohort.",
    },
    {
      text: " A structured log changes that: every prompt, answer and critique becomes a step, so a grader can audit the process in minutes rather than hours.",
    },
  ],
  [
    {
      text: "Critics argue that logs can be faked. That is true of any self-report, but a log that has to name the error, the check and the change is much harder to fake than a reflective paragraph written the night before.",
    },
  ],
  [
    {
      step: 5,
      text: "Ultimately, the two-lane model represents a transformative shift that empowers students to engage critically with emerging technologies while safeguarding academic integrity.",
    },
    { text: " " },
    {
      step: 8,
      text: "If universities want Lane 2 to mean something, they have to make the messy middle visible.",
    },
  ],
];

export const summary = summarise(steps, student.finalWords);

export interface CohortFlag extends StepFlag {
  name: string;
  step: number;
  stepTitle: string;
  critique: string;
}

const flagsFor = (name: string): CohortFlag[] =>
  steps.flatMap((step, index) =>
    step.flag
      ? [
          {
            ...step.flag,
            critique: step.critique,
            name,
            step: index + 1,
            stepTitle: step.title,
          },
        ]
      : []
  );

export const cohortFlags: CohortFlag[] = [
  {
    body: "No verdict, check or change. 112 words of the answer reached paragraph 2 unchanged.",
    critique: "ok",
    name: "Mateo Silva",
    step: 3,
    stepTitle: "Draft the body",
    title: "Accepted without critique",
  },
  {
    body: "The critique repeats the AI's own wording and names no source the student checked.",
    critique:
      "This answer provides a comprehensive and nuanced overview of the key considerations.",
    name: "Mateo Silva",
    step: 6,
    stepTitle: "Review the argument",
    title: "Critique reads as AI-written",
  },
  {
    body: "Two words, no check described. The suggested sources appear in the reference list.",
    critique: "Seems right.",
    name: "Hana Kim",
    step: 2,
    stepTitle: "Find sources",
    title: "Accepted without critique",
  },
  {
    body: "The critique could describe any edit. It names no change and no reason.",
    critique: "Fixed it up a bit.",
    name: "Grace O'Connor",
    step: 5,
    stepTitle: "Polish paragraph 3",
    title: "Generic critique",
  },
  ...flagsFor(student.name),
];

type Status = "review" | "done";

export interface CohortStudent {
  name: string;
  id: string;
  traced: number;
  depth: number;
  caught: number;
  flags: number;
  status: Status;
  submitted: string;
  /* Minutes after Monday 00:00 of the due week, so submissions sort by time rather than by label. */
  submittedAt: number;
  steps: Pick<Step, "words" | "carried" | "critiqueWords" | "flag">[];
  detail: boolean;
}

/*
  A seeded sequence keeps the example cohort identical on every render and in every test. The fractional part
  of a scaled sine is the usual shader hash: not random enough for anything that matters, plenty for example rows.
*/
const seeded = (seed: number) => {
  let call = seed;
  return () => {
    call += 1;
    const value = Math.sin(call * 12.9898) * 43_758.5453;
    return value - Math.floor(value);
  };
};

const NAMES = [
  "Mateo Silva",
  "Hana Kim",
  "Grace O'Connor",
  "John Doe",
  "Aroha Ngata",
  "Liam Chen",
  "Priya Raman",
  "Tama Walker",
  "Sofia Rossi",
  "Arjun Patel",
  "Mei Lin Wong",
  "Noah Taufa",
  "Wiremu Parata",
  "Emily Zhang",
  "Isabella Fonoti",
  "Jack Thompson",
  "Ananya Iyer",
  "Leo Müller",
];

const DAYS = ["Wed", "Thu", "Fri"];

/* The flagged students and the open one keep fixed figures so the plot, table and flags agree. */
const fixed = new Map([
  ["Grace O'Connor", { caught: 1, depth: 1.3, traced: 0.22 }],
  ["Hana Kim", { caught: 1, depth: 1.1, traced: 0.47 }],
  [
    student.name,
    {
      caught: summary.caught,
      depth: summary.depth,
      traced: 1 - summary.untraced,
    },
  ],
  ["Mateo Silva", { caught: 0, depth: 0.8, traced: 0.54 }],
]);

const random = seeded(399);

export const cohort: CohortStudent[] = Array.from(
  { length: 41 },
  (_, index) => {
    const name = NAMES[index] ?? `Student ${index + 1}`;
    const flags = cohortFlags.filter((flag) => flag.name === name).length;
    const known = fixed.get(name);
    const depth = known?.depth ?? 1.5 + random() * 1.5;
    const traced = known?.traced ?? 0.06 + random() * 0.36;
    const hours = Math.floor(random() * 50);
    const isJohn = name === student.name;
    const day = isJohn ? 2 : hours % 3;
    const hour = isJohn ? 16 : 9 + (hours % 14);
    const minute = isJohn ? 42 : (hours * 7) % 60;
    return {
      caught: known?.caught ?? Math.floor(random() * 5),
      depth,
      detail: isJohn,
      flags,
      id: isJohn ? student.id : `s12${Math.floor(random() * 90_000) + 10_000}`,
      name,
      status: flags > 0 || (index < 23 && random() <= 0.42) ? "review" : "done",
      steps: isJohn
        ? steps
        : Array.from({ length: 6 + Math.floor(random() * 5) }, (__, step) => {
            const words = 120 + random() * 300;
            const flag = cohortFlags.find(
              (item) => item.name === name && item.step === step + 1
            );
            return {
              carried: random() > 0.55 ? words * random() * (traced / 0.6) : 0,
              critiqueWords: flag ? 3 : 30 + random() * 90 * (depth / 3),
              flag,
              words,
            };
          }),
      submitted: `${DAYS[day]} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      submittedAt: (day + 2) * 1440 + hour * 60 + minute,
      traced,
    };
  }
);

export const cohortSize = 48;

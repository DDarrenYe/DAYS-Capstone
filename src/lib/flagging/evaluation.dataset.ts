import { composeCritique } from "@/lib/process";

import type { LabelledStep } from "./evaluation";

const survey = {
  aiAnswer:
    "The 2023 survey found that 71 percent of first-year students used an AI tool weekly (Smith and Lee, 2023).",
  prompt: "What did the 2023 survey find about first-year AI use?",
};

const photosynthesis = {
  aiAnswer:
    "Photosynthesis converts light energy into chemical energy stored in glucose. This happens in the mitochondria of plant cells.",
  prompt: "Explain how photosynthesis stores energy.",
};

const median = {
  aiAnswer:
    "def median(xs): xs.sort(); return xs[len(xs) // 2]. This returns the middle value of the list.",
  prompt: "Write a Python function that returns the median of a list.",
};

const law = {
  aiAnswer:
    "In Australian civil cases the standard of proof is beyond reasonable doubt.",
  prompt: "What is the standard of proof in a civil case in Australia?",
};

const economics = {
  aiAnswer: "Inflation is caused only by governments printing money.",
  prompt: "What causes inflation?",
};

const versailles = {
  aiAnswer:
    "The Treaty of Versailles was signed on 28 June 1919 at the Palace of Versailles.",
  prompt: "When was the Treaty of Versailles signed?",
};

const chemistry = {
  aiAnswer: "The pH of pure water at 25 C is 7.",
  prompt: "What is the pH of pure water at 25 C?",
};

const statistics = {
  aiAnswer:
    "A p-value of 0.03 means there is a 3 percent chance that the null hypothesis is true.",
  prompt: "What does a p-value of 0.03 mean?",
};

const capital = {
  aiAnswer: "The capital of Australia is Sydney.",
  prompt: "What is the capital of Australia?",
};

const boiling = {
  aiAnswer: "Water boils at 100 degrees Celsius at sea level.",
  prompt: "What is the boiling point of water at sea level in Celsius?",
};

const wallace = {
  aiAnswer:
    "Alfred Russel Wallace independently proposed the theory, and their papers were read together at the Linnean Society in 1858.",
  prompt: "Who proposed the theory of natural selection alongside Darwin?",
};

const all = { aiCorrectness: true, changes: true, verification: true };

export const DATASET: readonly LabelledStep[] = [
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-survey",
    step: {
      ...survey,
      critique: composeCritique({
        change: "Replaced it with the Sydney guidance.",
        check: "Searched Google Scholar and the library.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-photosynthesis",
    step: {
      ...photosynthesis,
      critique: composeCritique({
        change: "Changed mitochondria to chloroplasts.",
        check: "Looked it up in my biology textbook, chapter 4.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-median",
    step: {
      ...median,
      critique: composeCritique({
        change:
          "Averaged the two middle values and used sorted() instead of sort().",
        check:
          "Ran it on [1, 2, 3, 4] and got 3, but the median is 2.5. It also reorders my list.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-law",
    step: {
      ...law,
      critique: composeCritique({
        change: "Changed it to the balance of probabilities.",
        check: "Compared it with Briginshaw v Briginshaw and my lecture notes.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-statistics",
    step: {
      ...statistics,
      critique: composeCritique({
        change: "Rewrote the sentence to say that.",
        check:
          "My stats textbook defines it as the probability of data this extreme if the null is true.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-capital",
    step: {
      ...capital,
      critique: composeCritique({
        change: "Replaced Sydney with Canberra.",
        check: "Checked the Australian Government website.",
        sources: ["https://www.australia.gov.au/states-and-territories"],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-economics",
    step: {
      ...economics,
      critique: composeCritique({
        change:
          "Added demand-pull and cost-push causes and dropped the word 'only'.",
        check: "Compared it with the RBA's explainer on inflation.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-chemistry-temperature",
    step: {
      ...chemistry,
      critique: composeCritique({
        change: "Added a sentence saying it is about 6.1 at 100 C.",
        check:
          "The answer holds at 25 C, but the pH of pure water changes with temperature.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-casual",
    step: {
      ...survey,
      critique: composeCritique({
        change: "swapped it for the sydney guidance doc",
        check:
          "ok so the ai said 71% but i couldnt find that survey anywhere?? checked scholar + uni library, nothing",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-formal-median",
    step: {
      ...median,
      critique: composeCritique({
        change:
          "I replaced the indexing with a calculation that averages the two middle values.",
        check:
          "I executed the function on an even-length list. It returned the upper middle element rather than the mean of the two middle elements, which is incorrect.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-formal-law",
    step: {
      ...law,
      critique: composeCritique({
        change: "I corrected the standard of proof in the first sentence.",
        check:
          "I consulted my course reader, which states that civil matters are decided on the balance of probabilities, and compared this against the lecture slides.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: all,
    category: "specific",
    flags: [],
    id: "specific-formal-economics",
    step: {
      ...economics,
      critique: composeCritique({
        change: "I added the two omitted causes and softened the claim.",
        check:
          "The explanation is incomplete. According to the RBA explainer, inflation can arise from demand, costs and expectations, which the answer reduces to a single cause.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-versailles",
    step: {
      ...versailles,
      critique: composeCritique({
        change: "Kept the sentence unchanged.",
        check:
          "Read the treaty text on the National Archives site and the signing date matches.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-chemistry",
    step: {
      ...chemistry,
      critique: composeCritique({
        change: "Kept it and added the temperature note.",
        check:
          "Compared it with my chemistry textbook table and a lecture slide. Both say 7 at 25 C.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-survey",
    step: {
      ...survey,
      critique: composeCritique({
        change: "Kept the sentence as it was.",
        check: "Read Table 2 of the survey. The 71 percent figure matches.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-versailles-textbooks",
    step: {
      ...versailles,
      critique: composeCritique({
        change: "Left it as it was and only fixed the citation format.",
        check: "Cross-checked two history textbooks and the dates agree.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-boiling",
    step: {
      ...boiling,
      critique: composeCritique({
        change: "Kept the number and added 'at standard pressure'.",
        check:
          "Looked up the boiling point in the CRC handbook and measured 99.8 C with our thermometer in lab 2.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: all,
    category: "verified",
    flags: [],
    id: "verified-wallace",
    step: {
      ...wallace,
      critique: composeCritique({
        change: "Kept it and added the title of Wallace's paper.",
        check:
          "Checked the Natural History Museum page and Darwin Online. Both give 1858 and the Linnean Society.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance", "low_effort_reflection"],
    id: "thin-looks-good",
    step: {
      ...survey,
      critique: composeCritique({
        change: "",
        check: "Looks good.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance", "low_effort_reflection"],
    id: "thin-fine",
    step: {
      ...photosynthesis,
      critique: composeCritique({
        change: "",
        check: "Fine.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance"],
    id: "thin-trusted-it",
    step: {
      ...versailles,
      critique: composeCritique({
        change: "Nothing, I used it as it was.",
        check: "I read it and it made sense to me, so I trusted it.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["low_effort_reflection"],
    id: "thin-wrong-no-detail",
    step: {
      ...capital,
      critique: composeCritique({
        change: "Fixed it.",
        check: "It was wrong.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance", "low_effort_reflection"],
    id: "thin-ai-usually-right",
    step: {
      ...economics,
      critique: composeCritique({
        change: "",
        check: "AI is usually right about economics.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: false, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance", "low_effort_reflection"],
    id: "thin-seems-okay",
    step: {
      ...statistics,
      critique: composeCritique({
        change: "",
        check: "Seems okay.",
        sources: [],
        verdict: null,
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "thin",
    flags: ["blind_acceptance"],
    id: "thin-high-school",
    step: {
      ...law,
      critique: composeCritique({
        change: "None.",
        check: "Same as what I learned in high school.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "ambiguous",
    flags: [],
    id: "ambiguous-doubt-only",
    note: "Names a specific doubt, but nothing was checked or changed. A partly-right verdict is not acceptance.",
    step: {
      ...median,
      critique: composeCritique({
        change: "",
        check: "Not sure about the even-length case.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "ambiguous",
    flags: ["blind_acceptance"],
    id: "ambiguous-lecture-memory",
    note: "Recall from a lecture is not a check, though it may be all this answer needed.",
    step: {
      ...survey,
      critique: composeCritique({
        change: "Kept it.",
        check: "Matches what I remember from the lecture.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: true },
    category: "ambiguous",
    flags: [],
    id: "ambiguous-terse-source",
    note: "Terse, but it names the source it was checked against.",
    step: {
      ...versailles,
      critique: composeCritique({
        change: "Kept.",
        check: "Treaty text, National Archives.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: true, verification: false },
    category: "ambiguous",
    flags: [],
    id: "ambiguous-from-memory",
    note: "Gives the right answer and the fix, but names no check.",
    step: {
      ...capital,
      critique: composeCritique({
        change: "Changed to Canberra.",
        check: "Common mistake, it's Canberra.",
        sources: [],
        verdict: "wrong",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "ambiguous",
    flags: ["blind_acceptance"],
    id: "ambiguous-group-chat",
    note: "A discussion outside the log may have been a real check that the text does not show.",
    step: {
      ...chemistry,
      critique: composeCritique({
        change: "Kept it.",
        check: "We talked about it in our group chat and agreed.",
        sources: [],
        verdict: "right",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "ambiguous",
    flags: ["low_effort_reflection"],
    id: "ambiguous-long-generic",
    note: "Long, but it could be about any answer.",
    step: {
      ...economics,
      critique: composeCritique({
        change: "I made some changes to make it more accurate.",
        check:
          "I think the answer simplifies a complex topic and there are many factors involved in inflation including various economic forces.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: true, verification: true },
    category: "ambiguous",
    flags: [],
    id: "ambiguous-verdict-in-text",
    note: "The verdict is only in the check text, and the change is one short clause.",
    step: {
      ...statistics,
      critique: composeCritique({
        change: "Rewrote the sentence.",
        check:
          "A p-value is not the probability the null is true, see the ASA statement on p-values (Wasserstein, 2016).",
        sources: [],
        verdict: null,
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "ambiguous",
    flags: [],
    id: "ambiguous-names-error",
    note: "Names the exact error but not how it was found or what changed.",
    step: {
      ...photosynthesis,
      critique: composeCritique({
        change: "Changed it.",
        check: "AI got mitochondria wrong.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "polished",
    flags: ["reads_like_ai", "low_effort_reflection"],
    id: "polished-overview",
    note: "Polished and generic. It says verification matters but describes none.",
    step: {
      ...survey,
      critique: composeCritique({
        change: "Minor edits were made to improve clarity and accuracy.",
        check:
          "The response provides a comprehensive and well-structured overview of the survey findings. While the statistic appears plausible, it is important to verify the primary source before relying on it. Overall, the output demonstrates a strong understanding of the topic.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: true, verification: false },
    category: "polished",
    flags: ["reads_like_ai"],
    id: "polished-photosynthesis",
    note: "Specific about the error and fix, but no check is named and the wording is formal.",
    step: {
      ...photosynthesis,
      critique: composeCritique({
        change:
          "The content was revised to state that photosynthesis occurs in the chloroplasts rather than the mitochondria.",
        check:
          "Upon careful analysis, the response contains a factual inaccuracy regarding the location of photosynthesis.",
        sources: [],
        verdict: "partly",
      }),
    },
  },
  {
    addressed: { aiCorrectness: true, changes: false, verification: false },
    category: "polished",
    flags: ["reads_like_ai", "blind_acceptance"],
    id: "polished-versailles",
    note: "Formal approval that cites no source and changes nothing.",
    step: {
      ...versailles,
      critique: composeCritique({
        change: "No modifications were deemed necessary.",
        check:
          "The response accurately states the date and location of the signing of the Treaty of Versailles. The information aligns with widely accepted historical records.",
        sources: [],
        verdict: "right",
      }),
    },
  },
];

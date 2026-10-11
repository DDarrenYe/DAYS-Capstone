/*
  Margin icons. Duotone on a 20px grid: a 1.5 stroke, a soft body tinted from the same colour, and one accent
  (--icon-accent, cobalt where it means something) on the detail worth noticing. Containers use 2.25 radii,
  live area 3.25 to 16.75. Small touches carry the character: the flag waves, the lens has a shine, finished
  log steps are filled and the next one is open.
*/
const TINT = 'fill="currentColor" fill-opacity=".14" stroke="none"';
const ACCENT = 'fill="var(--icon-accent, currentColor)" stroke="none"';
const path = (d, attrs = "") => `<path d="${d}" ${attrs}/>`;
const tint = (d) => path(d, TINT);
const dot = (cx, cy, r = 1.1, attrs = ACCENT) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
const SHEET = "M11 2.75H6.25A2.25 2.25 0 0 0 4 5v10a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 16 15V7.75z";
const FOLD = "M11 2.75v2.75a2.25 2.25 0 0 0 2.25 2.25H16z";
const sheet = (inner) => tint(FOLD) + path(SHEET) + path("M11 2.75v2.75a2.25 2.25 0 0 0 2.25 2.25H16") + inner;

const ICONS = {
  queue:
    path("M6.25 10V4.75a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5V10") + path("M9.5 7.25h2", 'stroke-opacity=".55"') + dot(8, 7.25, 0.9) +
    tint("M3.25 10h3.4l.75 1.4c.2.36.57.6.98.6h3.24c.41 0 .78-.24.98-.6l.75-1.4h3.4v4.5a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 3.25 14.5z") +
    path("M3.25 10h3.4l.75 1.4c.2.36.57.6.98.6h3.24c.41 0 .78-.24.98-.6l.75-1.4h3.4v4.5a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 3.25 14.5z"),
  submissions:
    tint("M7 4.75V4.5a2 2 0 0 1 2-2h5.25a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H13.5V6.75a2 2 0 0 0-2-2z") +
    path("M7 4.75V4.5a2 2 0 0 1 2-2h5.25a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H13.5") +
    path("M5.75 4.75h5.75a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2z") +
    path("M8.5 9.25h2.25 M8.5 12.5h1.25") + dot(6.4, 9.25, 0.95),
  flag:
    tint("M5 4.75c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0v6.5c-1.6 1-3.2 1-4.8 0S6.6 10.25 5 11.25z") +
    path("M5 4.75c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0v6.5c-1.6 1-3.2 1-4.8 0S6.6 10.25 5 11.25") +
    path("M5 17.25V4.25") + dot(5, 3, 1.3),
  report: sheet(path("M7.5 14.25v-1.25 M12.5 14.25v-2.25") + path("M10 14.25v-4", 'stroke="var(--icon-accent, currentColor)"')),
  essay: sheet(path("M9 11h3.75 M9 14h2.25") + dot(7, 11, 1)),
  search:
    tint("M8.75 14a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5z") +
    path("M8.75 14a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5z") +
    path("M6.4 7.6a2.6 2.6 0 0 1 1.7-1.75", 'stroke="var(--icon-accent, currentColor)"') +
    path("M12.75 12.75 16.5 16.5", 'stroke-width="2.25"'),
  down: path("M6 8.25l4 4 4-4"),
  up: path("M6 11.75l4-4 4 4"),
  left: path("M11.75 6l-4 4 4 4"),
  right: path("M8.25 6l4 4-4 4"),
  updown: path("M7 7.75l3-3 3 3 M7 12.25l3 3 3-3"),
  export:
    tint("M3.75 11.75h3.1l.62 1.24c.17.34.52.56.9.56h3.26c.38 0 .73-.22.9-.56l.62-1.24h3.1v2.5a2.5 2.5 0 0 1-2.5 2.5h-7.5a2.5 2.5 0 0 1-2.5-2.5z") +
    path("M3.75 11.75h3.1l.62 1.24c.17.34.52.56.9.56h3.26c.38 0 .73-.22.9-.56l.62-1.24h3.1 M3.75 11.75v2.5a2.5 2.5 0 0 0 2.5 2.5h7.5a2.5 2.5 0 0 0 2.5-2.5v-2.5") +
    path("M10 10V3.25 M7.25 6 10 3.25 12.75 6", 'stroke="var(--icon-accent, currentColor)"'),
  check: path("M5 10.25l3.25 3.25L15 6.75", 'stroke-width="1.75"'),
  caught: tint("M10 16.75a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5z") + path("M10 16.75a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5z") + path("M7 10.25l2 2 4-4.25"),
  x: path("M6.25 6.25l7.5 7.5 M13.75 6.25l-7.5 7.5"),
  panel:
    tint("M3.5 5.75A2.25 2.25 0 0 1 5.75 3.5H8.5v13H5.75A2.25 2.25 0 0 1 3.5 14.25z") +
    path("M5.75 3.5h8.5a2.25 2.25 0 0 1 2.25 2.25v8.5a2.25 2.25 0 0 1-2.25 2.25h-8.5A2.25 2.25 0 0 1 3.5 14.25v-8.5A2.25 2.25 0 0 1 5.75 3.5z M8.5 3.5v13") +
    path("M5.5 6.75h1 M5.5 9h1"),
  log:
    dot(5.75, 4.75, 1.75) + dot(5.75, 10, 1.75) + dot(5.75, 15.25, 1.4, 'fill="none"') +
    path("M5.75 7.25v.25 M5.75 12.5v.25") + path("M9.5 4.75h6.25 M9.5 10h5 M9.5 15.25h3.25"),
  progress:
    tint("M4.25 12.25a1.25 1.25 0 0 1 1.25-1.25h.5a1.25 1.25 0 0 1 1.25 1.25v3.25a1.25 1.25 0 0 1-1.25 1.25h-.5a1.25 1.25 0 0 1-1.25-1.25z M8.5 8.75A1.25 1.25 0 0 1 9.75 7.5h.5a1.25 1.25 0 0 1 1.25 1.25v6.75a1.25 1.25 0 0 1-1.25 1.25h-.5A1.25 1.25 0 0 1 8.5 15.5z") +
    path("M4.25 12.25a1.25 1.25 0 0 1 1.25-1.25h.5a1.25 1.25 0 0 1 1.25 1.25v3.25a1.25 1.25 0 0 1-1.25 1.25h-.5a1.25 1.25 0 0 1-1.25-1.25z M8.5 8.75A1.25 1.25 0 0 1 9.75 7.5h.5a1.25 1.25 0 0 1 1.25 1.25v6.75a1.25 1.25 0 0 1-1.25 1.25h-.5A1.25 1.25 0 0 1 8.5 15.5z") +
    path("M12.75 4.5a1.25 1.25 0 0 1 1.25-1.25h.5a1.25 1.25 0 0 1 1.25 1.25v11a1.25 1.25 0 0 1-1.25 1.25H14a1.25 1.25 0 0 1-1.25-1.25z", 'fill="var(--icon-accent, currentColor)" stroke="var(--icon-accent, currentColor)"'),
  link:
    path("M8.25 11.75 11.75 8.25") +
    path("M9.4 5.85l1.15-1.15a3.05 3.05 0 0 1 4.3 4.3l-1.15 1.15") +
    path("M10.6 14.15l-1.15 1.15a3.05 3.05 0 0 1-4.3-4.3l1.15-1.15", 'stroke="var(--icon-accent, currentColor)"'),
  sort: path("M6.5 4.25v11.5 M3.75 13l2.75 2.75L9.25 13 M13.5 15.75V4.25 M10.75 7l2.75-2.75L16.25 7"),
  plus: path("M10 4.75v10.5 M4.75 10h10.5"),
  eye:
    tint("M2.75 10S5.5 4.75 10 4.75 17.25 10 17.25 10 14.5 15.25 10 15.25 2.75 10 2.75 10z") +
    path("M2.75 10S5.5 4.75 10 4.75 17.25 10 17.25 10 14.5 15.25 10 15.25 2.75 10 2.75 10z") +
    dot(10, 10, 2.5) + dot(10.85, 9.15, 0.65, 'fill="#fff" stroke="none"'),
  note:
    tint("M5.75 3.75h8.5a2.25 2.25 0 0 1 2.25 2.25v5.5a2.25 2.25 0 0 1-2.25 2.25H10l-3.5 2.75v-2.75h-.75A2.25 2.25 0 0 1 3.5 11.5V6a2.25 2.25 0 0 1 2.25-2.25z") +
    path("M5.75 3.75h8.5a2.25 2.25 0 0 1 2.25 2.25v5.5a2.25 2.25 0 0 1-2.25 2.25H10l-3.5 2.75v-2.75h-.75A2.25 2.25 0 0 1 3.5 11.5V6a2.25 2.25 0 0 1 2.25-2.25z") +
    dot(7, 8.75, 0.95, 'fill="currentColor" stroke="none"') + dot(10, 8.75, 0.95, 'fill="currentColor" stroke="none"') + dot(13, 8.75, 0.95),
  more: dot(5, 10, 1.4, 'fill="currentColor" stroke="none"') + dot(10, 10, 1.4, 'fill="currentColor" stroke="none"') + dot(15, 10, 1.4, 'fill="currentColor" stroke="none"'),
  wrong: path("M4.75 5.5h10.5 M4.75 9h7") + path("M4.25 14c.9-.9 1.85-.9 2.75 0s1.85.9 2.75 0 1.85-.9 2.75 0 1.85.9 2.75 0", 'stroke="var(--icon-accent, currentColor)" stroke-width="1.75"'),
  unsourced:
    path("M8.5 12.5l-1.25 1.25a2.5 2.5 0 0 1-3.54-3.54L4.96 9 M11.5 7.5l1.25-1.25a2.5 2.5 0 0 1 3.54 3.54L15.04 11") +
    path("M7 3.75V5.5 M3.75 7H5.5 M13 16.25V14.5 M16.25 13H14.5", 'stroke="var(--icon-accent, currentColor)"'),
  used:
    tint("M9 3.25H6.25A2.25 2.25 0 0 0 4 5.5v9.25A2.25 2.25 0 0 0 6.25 17h7.5A2.25 2.25 0 0 0 16 14.75v-3z") +
    path("M9 3.25H6.25A2.25 2.25 0 0 0 4 5.5v9.25A2.25 2.25 0 0 0 6.25 17h7.5A2.25 2.25 0 0 0 16 14.75v-3") +
    path("M16.5 3.5l-5.25 5.25 M11.25 5.25v3.5h3.5", 'stroke="var(--icon-accent, currentColor)"'),
  book:
    tint("M10 5.5C8.6 4.3 6.6 3.75 3.75 3.75v11c2.85 0 4.85.55 6.25 1.75 1.4-1.2 3.4-1.75 6.25-1.75v-11C13.4 3.75 11.4 4.3 10 5.5z") +
    path("M10 5.5C8.6 4.3 6.6 3.75 3.75 3.75v11c2.85 0 4.85.55 6.25 1.75 1.4-1.2 3.4-1.75 6.25-1.75v-11C13.4 3.75 11.4 4.3 10 5.5z M10 5.5v10.75") +
    path("M12.25 4.4h2.25v4.85l-1.13-.9-1.12.9z", ACCENT),
};

const logo = (size = 26) => `<svg width="${size}" height="${size}" viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="7" fill="#18191b"/><path d="M9 6.5v13" stroke="#f4f4f0" stroke-width="1.5" stroke-linecap="round"/><path d="M12.5 9.5h6M12.5 13h4.2M12.5 16.5h5.4" stroke="#f4f4f0" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/><circle cx="5.6" cy="13" r="1.5" fill="#8fa5f2"/></svg>`;

function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/*
  The small process chart: AI words rise above the baseline (the part that reached the essay in solid cobalt),
  critique words hang below it on the same scale, so a thin critique looks thin.
*/
function processBars(steps, { width, height, base, scale, labels = false }) {
  const slot = width / steps.length, bw = Math.min(slot * 0.6, 14);
  let out = `<svg width="${width}" height="${height}"><line x1="0" x2="${width}" y1="${base + 0.5}" y2="${base + 0.5}" stroke="var(--border-strong)"/>`;
  steps.forEach((s, i) => {
    const x = slot * i + (slot - bw) / 2;
    out += `<rect x="${x}" y="${base - s.words * scale}" width="${bw}" height="${s.words * scale}" rx="2" fill="var(--ai-soft)"/>`;
    if (s.carried) out += `<rect x="${x}" y="${base - s.carried * scale}" width="${bw}" height="${s.carried * scale}" rx="2" fill="var(--ai)"/>`;
    out += `<rect x="${x}" y="${base + 1.5}" width="${bw}" height="${Math.max(s.critique * scale, 1.5)}" rx="1.5" fill="${s.flag ? "var(--flag)" : "var(--human)"}"/>`;
    if (labels) out += `<text x="${x + bw / 2}" y="${height - 1}" text-anchor="middle" style="font:500 7px var(--mono);fill:var(--faint)">S${i + 1}</text>`;
  });
  return `${out}</svg>`;
}

function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll("[data-icon]")) el.outerHTML = icon(el.dataset.icon, el.dataset.size);
  for (const el of root.querySelectorAll("[data-logo]")) el.outerHTML = logo(el.dataset.size);
}

/*
  John Doe, Essay 2. 1,204 final words; 384 trace to logged AI answers, so 68% does not.
  words: AI answer length. critique: student critique length. carried: AI words found in the final essay.
*/
const STEPS = [
  { title: "Outline the argument", day: "Mon", time: "Mon 6 Oct · 19:02", words: 310, critique: 64, carried: 0, depth: 2,
    asked: "Give me an outline for an essay arguing that Lane 2 assessment only works if graders can see how students used AI.",
    answer: "1. The rise of generative AI. 2. Assessment pressure on universities. 3. The two-lane model defined. 4. Why visibility matters. 5. Making process visible.",
    critiqueText: "A useful skeleton, but it defines the two lanes in section 3. A reader needs that first, so I moved it into the intro and merged 4 and 5, which said the same thing.",
    checks: [true, true, true] },
  { title: "Find two sources", day: "Mon", time: "Mon 6 Oct · 19:40", words: 420, critique: 88, carried: 0, depth: 3, caught: "Invented source",
    asked: "Find two academic sources that support the idea that process evidence matters in AI-permitted assessment.",
    answer: "Liu & Bridgeman (2023), Teaching@Sydney, on the two-lane approach; and <s>Smith & Roberts (2022), Journal of Assessment Futures, 14(2)</s>, on process-based marking.",
    critiqueText: "The second source does not exist. I searched Google Scholar and the publisher's site and found nothing. I replaced it with the University of Auckland's TeachWell guidance, which I read in full.",
    checks: [true, true, true] },
  { title: "Draft the intro", day: "Tue", time: "Tue 7 Oct · 14:20", words: 260, critique: 52, carried: 150, depth: 2,
    asked: "Draft an opening paragraph that introduces the two-lane model in plain language.",
    answer: "<mark>The two-lane model: secure, supervised assessment in Lane 1, and open use of AI in Lane 2, where students are marked on how they use it.</mark> It was introduced to respond to tools that can now produce fluent work instantly.",
    critiqueText: "Kept the definition because it is accurate and clear. Cut the second sentence; it repeats my first line.",
    checks: [true, true, false] },
  { title: "Check the facts", day: "Tue", time: "Tue 7 Oct · 14:51", words: 180, critique: 96, carried: 0, depth: 3, caught: "Wrong date",
    asked: "When did Sydney introduce the two-lane approach, and who wrote about it?",
    answer: "The two-lane model, introduced in <s>2019</s>, separates secure assessment from open tasks where AI use is allowed.",
    critiqueText: "Wrong date. Liu and Bridgeman's article is from 2023 and the approach was introduced that year. I checked the article itself and corrected my intro.",
    checks: [true, true, true] },
  { title: "Strengthen paragraph 2", day: "Wed", time: "Wed 8 Oct · 10:05", words: 290, critique: 47, carried: 130, depth: 2,
    asked: "My second paragraph needs evidence about how students and staff experience AI logs. Suggest a stronger version.",
    answer: "<mark>Most students already use AI tools every week, and staff report that raw chat logs are too long to read across a large cohort.</mark> Structured evidence could reduce this burden.",
    critiqueText: "The claim about staff matches what our lecturer said in week 4. I kept the first sentence and wrote the rest myself.",
    checks: [true, true, false] },
  { title: "Check the conclusion", day: "Thu", time: "Thu 9 Oct · 21:14", words: 340, critique: 2, carried: 64, depth: 0,
    flag: { title: "Accepted without critique", body: "The critique is two words and describes no check. 64 words of this answer appear unchanged in the conclusion." },
    asked: "Can you check my conclusion and make it sound more academic?",
    answer: "<mark>Ultimately, the two-lane model represents a transformative shift that empowers students to engage critically with emerging technologies while safeguarding academic integrity.</mark> Consider closing with a call to action for institutions.",
    critiqueText: "Looks good.",
    checks: [false, false, false] },
  { title: "Fix a misquoted statistic", day: "Thu", time: "Thu 9 Oct · 21:32", words: 220, critique: 112, carried: 0, depth: 3, caught: "Misquoted statistic",
    asked: "Is it true that nine in ten students use AI for assignments?",
    answer: "Yes, surveys consistently show that <s>around 90% of students</s> use AI tools for their assignments.",
    critiqueText: "Not what the survey says. The 2025 Universities NZ survey reports 64% weekly use, and it does not say it is for assignments. I rewrote the sentence to say every week and cited the survey.",
    checks: [true, true, true] },
  { title: "Tighten the wording", day: "Fri", time: "Fri 10 Oct · 15:10", words: 160, critique: 5, carried: 0, depth: 1,
    flag: { title: "Generic critique", body: "The critique could describe any edit. It names no change and no reason, so it does not show evaluation." },
    asked: "Make paragraph 4 more concise.",
    answer: "Critics argue logs can be faked. Yet a log that names the error, the check and the change is far harder to fake than a reflection written the night before.",
    critiqueText: "Made it shorter, reads better.",
    checks: [false, false, true] },
  { title: "Final proofread", day: "Fri", time: "Fri 10 Oct · 16:20", words: 120, critique: 41, carried: 40, depth: 2,
    asked: "Proofread my final paragraph for clarity.",
    answer: "<mark>If universities want Lane 2 to mean something, they have to make the messy middle visible.</mark> The rest reads clearly.",
    critiqueText: "Fixed two commas. I wrote the last line myself and the AI only shortened it, so I kept its version.",
    checks: [true, false, true] },
];

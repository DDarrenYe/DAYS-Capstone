/* oxlint-disable shadcn/no-inline-styles -- react-pdf primitives take no class names, so every style is an object */
import {
  Document,
  G,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  Line as SvgLine,
  Text as SvgText,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { CHECK_STATE } from "@/app/instructor/check-state";
import { stamp } from "@/app/instructor/visualiser/submission-detail";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { MARKS } from "@/app/student/log/marked-answer";
import type { ExportSections } from "@/lib/export-options";
import { FLAG_STATE_LABEL } from "@/lib/flag-review";
import { matchCaveat, matchTotalsText } from "@/lib/match-copy";
import {
  critiqueOrder,
  critiqueQuestions,
  formatWords,
  wordsAxis,
} from "@/lib/process";
import { hasCheckResults } from "@/lib/submission-rows";

import {
  FONT_STACK,
  REPLACEMENT,
  hasUnshowable,
  loadFonts,
  printable,
} from "./fonts";

type Step = SubmissionDetail["steps"][number];

const COLOR = {
  ai: "#3e5fd0",
  aiSoft: "#dfe5fa",
  body: "#3b3d41",
  border: "#e7e6e1",
  borderStrong: "#d9d8d2",
  faint: "#9c9da1",
  flag: "#c8431b",
  flagSoft: "#fbede7",
  human: "#2b2c30",
  ink: "#151618",
  muted: "#6b6d72",
  reading: "#26272a",
};

const SIZE = 9.5;

const LEADING = { fontSize: SIZE, lineHeight: 1.4 };

const s = StyleSheet.create({
  block: { marginTop: 8 },
  body: { color: COLOR.body, ...LEADING },
  card: {
    borderColor: COLOR.border,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 6,
    padding: 8,
  },
  figure: {
    borderLeftColor: COLOR.border,
    borderLeftWidth: 1,
    flex: 1,
    paddingLeft: 8,
    paddingVertical: 8,
  },
  figureFirst: { borderLeftWidth: 0, paddingLeft: 0 },
  figureValue: {
    color: COLOR.ink,
    fontSize: 17,
    fontWeight: 600,
    marginTop: 2,
  },
  figures: {
    borderBottomColor: COLOR.border,
    borderBottomWidth: 1,
    borderTopColor: COLOR.border,
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: 14,
  },
  footer: {
    bottom: 22,
    color: COLOR.faint,
    flexDirection: "row",
    fontSize: 7.5,
    justifyContent: "space-between",
    left: 48,
    position: "absolute",
    right: 48,
  },
  heading: {
    color: COLOR.muted,
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 20,
    textTransform: "uppercase",
  },
  muted: { color: COLOR.muted },
  note: { color: COLOR.muted, ...LEADING },
  page: {
    color: COLOR.body,
    fontFamily: FONT_STACK,
    fontSize: SIZE,
    paddingBottom: 52,
    paddingHorizontal: 48,
    paddingTop: 44,
  },
  quote: {
    borderLeftColor: COLOR.borderStrong,
    borderLeftWidth: 2,
    color: COLOR.reading,
    marginTop: 4,
    paddingLeft: 8,
    ...LEADING,
  },
  row: {
    borderBottomColor: COLOR.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 4,
  },
  strong: { color: COLOR.ink, fontWeight: 600 },
  title: { color: COLOR.ink, fontSize: 24, fontWeight: 600, marginTop: 22 },
});

const COLUMNS = [
  { label: "#", style: { width: 24 } },
  { label: "Prompt", style: { flex: 1, paddingRight: 8 } },
  { label: "AI words", style: { textAlign: "right", width: 44 } },
  { label: "In essay", style: { textAlign: "right", width: 50 } },
  { label: "Critique", style: { textAlign: "right", width: 50 } },
  { label: "Questions", style: { textAlign: "right", width: 54 } },
  { label: "Flags", style: { paddingLeft: 12, width: 112 } },
] as const;

const CHART = { base: 74, height: 112, width: 499 };

const LEGEND = [
  [COLOR.aiSoft, "AI answer"],
  [COLOR.ai, "Reached the essay"],
  [COLOR.human, "Student critique"],
  [COLOR.flag, "Critique with an open flag"],
];

const text = (value: string) => printable(value.replaceAll("\r\n", "\n"));

const Heading = ({ children }: { children: ReactNode }) => (
  <Text minPresenceAhead={60} style={s.heading}>
    {children}
  </Text>
);

const Figure = ({
  children,
  first = false,
  label,
  tone = COLOR.ink,
}: {
  children: ReactNode;
  first?: boolean;
  label: string;
  tone?: string;
}) => (
  <View style={first ? [s.figure, s.figureFirst] : s.figure}>
    <Text style={s.muted}>{label}</Text>
    <Text style={[s.figureValue, { color: tone }]}>{children}</Text>
  </View>
);

const StepTitle = ({ index, step }: { index: number; step: Step }) => (
  <Text minPresenceAhead={50} style={s.strong}>
    S{index + 1} · {text(step.title)}
  </Text>
);

const flagTone = (state: Step["flags"][number]["state"]) =>
  state === "open" ? COLOR.flag : COLOR.muted;

const Summary = ({ detail }: { detail: SubmissionDetail }) => {
  const { match } = detail;
  const results = hasCheckResults(detail);
  const marked = detail.steps.flatMap((step, index) =>
    step.markedError ? [{ index, step }] : []
  );
  return (
    <>
      <View style={s.figures}>
        <Figure first label="Not from logged AI">
          {match.unmatchedPercent === null ? "—" : `${match.unmatchedPercent}%`}
        </Figure>
        <Figure label="AI errors marked">{detail.markedErrors}</Figure>
        <Figure label="Critique score">
          {detail.critiqueAverage.toFixed(1)} / {critiqueOrder.length}
        </Figure>
        <Figure
          label="Open flags"
          tone={detail.openFlags > 0 ? COLOR.flag : COLOR.ink}
        >
          {results ? detail.openFlags : "—"}
        </Figure>
        <Figure label="Added to feedback">
          {results ? detail.feedbackFlags : "—"}
        </Figure>
      </View>
      {match.totalWords === 0 ? null : (
        <Text style={[s.body, s.block]}>{matchTotalsText(match)}</Text>
      )}
      <Text style={[s.note, s.block]}>{matchCaveat(match.minWords)}</Text>
      <Text style={[s.note, s.block]}>
        Reflection check: {CHECK_STATE[detail.check].label}.{" "}
        {text(detail.analysis.note)}
      </Text>
      <Heading>AI errors the student marked ({marked.length})</Heading>
      {marked.length === 0 ? (
        <Text style={s.muted}>The student marked no AI errors.</Text>
      ) : (
        <>
          <Text style={[s.muted, { marginBottom: 4 }]}>
            These are what the student reported. They have not been checked.
          </Text>
          {marked.map(({ index, step }) => (
            <View key={step.id} style={s.row} wrap={false}>
              <Text style={[s.strong, { width: 24 }]}>S{index + 1}</Text>
              <Text style={[s.body, { flex: 1 }]}>
                {step.evidence === ""
                  ? "No evidence was written."
                  : text(step.evidence)}
              </Text>
            </View>
          ))}
        </>
      )}
    </>
  );
};

const Chart = ({ steps }: { steps: SubmissionDetail["steps"] }) => {
  const { base, height, width } = CHART;
  const slot = width / Math.max(steps.length, 1);
  const bar = Math.max(Math.min(slot * 0.6, 14), 1);
  const scale = (base - 1) / wordsAxis(steps);
  const below = height - base - 1.5 - 10;
  const labelEvery = Math.ceil(16 / slot);
  return (
    <>
      <Heading>Process</Heading>
      <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
        <SvgLine
          stroke={COLOR.borderStrong}
          strokeWidth={0.75}
          x1={0}
          x2={width}
          y1={base + 0.5}
          y2={base + 0.5}
        />
        {steps.map((step, index) => {
          const x = slot * index + (slot - bar) / 2;
          const up = step.words * scale;
          const kept = step.carried * scale;
          const down = Math.min(
            Math.max(step.critiqueWords * scale, 1.5),
            below
          );
          const labelled = index === 0 || (index + 1) % labelEvery === 0;
          return (
            <G key={step.id}>
              <Rect
                fill={COLOR.aiSoft}
                height={up}
                width={bar}
                x={x}
                y={base - up}
              />
              {step.carried > 0 ? (
                <Rect
                  fill={COLOR.ai}
                  height={kept}
                  width={bar}
                  x={x}
                  y={base - kept}
                />
              ) : null}
              <Rect
                fill={step.flag ? COLOR.flag : COLOR.human}
                height={down}
                width={bar}
                x={x}
                y={base + 1.5}
              />
              {labelled ? (
                <SvgText
                  fill={COLOR.faint}
                  style={{ fontSize: 7 }}
                  textAnchor="middle"
                  x={x + bar / 2}
                  y={height - 1}
                >
                  {`S${index + 1}`}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 6,
        }}
      >
        {LEGEND.map(([color, label]) => (
          <View
            key={label}
            style={{ alignItems: "center", flexDirection: "row", gap: 4 }}
          >
            <View style={{ backgroundColor: color, height: 7, width: 7 }} />
            <Text style={s.muted}>{label}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

const Overview = ({ steps }: { steps: SubmissionDetail["steps"] }) => (
  <>
    <Heading>Steps</Heading>
    <View style={s.row}>
      {COLUMNS.map(({ label, style }) => (
        <Text key={label} style={[s.muted, { fontSize: 7.5 }, style]}>
          {label}
        </Text>
      ))}
    </View>
    {steps.map((step, index) => (
      <View key={step.id} style={s.row} wrap={false}>
        <Text style={COLUMNS[0].style}>{index + 1}</Text>
        <Text style={COLUMNS[1].style}>{text(step.title)}</Text>
        <Text style={COLUMNS[2].style}>{step.words.toLocaleString("en")}</Text>
        <Text style={COLUMNS[3].style}>
          {step.carried.toLocaleString("en")}
        </Text>
        <Text style={COLUMNS[4].style}>
          {step.critiqueWords.toLocaleString("en")}
        </Text>
        <Text style={COLUMNS[5].style}>{step.depth} / 3</Text>
        <Text
          style={[
            COLUMNS[6].style,
            { color: step.flag ? COLOR.flag : COLOR.muted },
          ]}
        >
          {step.flag ?? (step.markedError ? "AI error marked" : "—")}
        </Text>
      </View>
    ))}
  </>
);

const Marks = ({ step }: { step: Step }) => (
  <>
    {step.marks.map((mark) => (
      <Text
        key={`${mark.start}-${mark.kind}`}
        style={[s.body, { marginTop: 3 }]}
      >
        {MARKS.find(({ kind }) => kind === mark.kind)?.label}: “
        {text(step.answer.slice(mark.start, mark.end))}”
        {mark.note ? ` — ${text(mark.note)}` : ""}
      </Text>
    ))}
  </>
);

const StepsInFull = ({ steps }: { steps: SubmissionDetail["steps"] }) => (
  <>
    <Heading>Every step in full</Heading>
    {steps.map((step, index) => (
      <View key={step.id} style={{ marginBottom: 12 }}>
        <StepTitle index={index} step={step} />
        <Text style={[s.muted, { marginTop: 1 }]}>
          {step.time} · AI answer {formatWords(step.words)}
          {step.carried > 0
            ? `, ${step.carried.toLocaleString("en")} reached the essay`
            : ""}
          {" · critique "}
          {formatWords(step.critiqueWords)}
        </Text>
        {step.critique === "" ? (
          <Text style={[s.note, s.block]}>
            No critique was written for this step.
          </Text>
        ) : (
          <Text style={s.quote}>{text(step.critique)}</Text>
        )}
        <Text style={[s.note, s.block]}>
          {critiqueOrder
            .map(
              (question) =>
                `${critiqueQuestions[question]}: ${step.answered[question] ? "answered" : "not answered"}`
            )
            .join(" · ")}
        </Text>
        <Marks step={step} />
      </View>
    ))}
  </>
);

const Prompts = ({ steps }: { steps: SubmissionDetail["steps"] }) => (
  <>
    <Heading>Full prompt history</Heading>
    {steps.map((step, index) => (
      <View key={step.id} style={{ marginBottom: 12 }}>
        <StepTitle index={index} step={step} />
        <Text style={[s.note, s.block]}>Asked · {step.time}</Text>
        <Text style={[s.body, { marginTop: 2 }]}>{text(step.asked)}</Text>
        <Text style={[s.note, s.block]}>
          AI answered · {formatWords(step.words)}
        </Text>
        <Text style={[s.body, { marginTop: 2 }]}>{text(step.answer)}</Text>
      </View>
    ))}
  </>
);

const FlagCard = ({
  flag,
  notes,
}: {
  flag: Step["flags"][number];
  notes: boolean;
}) => (
  <View style={s.card} wrap={false}>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={[s.strong, { color: flagTone(flag.state) }]}>
        {flag.label}
      </Text>
      <Text style={{ color: flagTone(flag.state), fontWeight: 600 }}>
        {FLAG_STATE_LABEL[flag.state]}
        {flag.reviewedAt ? ` · ${stamp(flag.reviewedAt)}` : ""}
      </Text>
    </View>
    <Text style={[s.body, { marginTop: 3 }]}>{text(flag.explanation)}</Text>
    {flag.evidence === "" ? null : (
      <Text style={s.quote}>{text(flag.evidence)}</Text>
    )}
    <Text style={[s.muted, { marginTop: 4 }]}>
      Reflection check · suggested
    </Text>
    {flag.earlier.map(({ at, note, state }) => (
      <Text key={at} style={[s.note, { marginTop: 2 }]}>
        Earlier decision: {FLAG_STATE_LABEL[state]} · {stamp(at)}
        {notes && note !== "" ? ` — ${text(note)}` : ""}
      </Text>
    ))}
    {notes && flag.note !== "" ? (
      <Text style={[s.body, { marginTop: 4 }]}>
        Decision note: {text(flag.note)}
      </Text>
    ) : null}
  </View>
);

const Flags = ({
  detail,
  notes,
}: {
  detail: SubmissionDetail;
  notes: boolean;
}) => {
  const flagged = detail.steps.flatMap((step, index) =>
    step.flags.length > 0 ? [{ index, step }] : []
  );
  return (
    <>
      <Heading>Flags and decisions</Heading>
      <Text style={s.note}>
        A flag is a possibility with a quote, not a finding. The check can miss
        thin critiques, so a step with no flag isn’t necessarily a good
        critique.
      </Text>
      {flagged.length === 0 ? (
        <Text style={[s.body, s.block]}>
          {hasCheckResults(detail)
            ? "The reflection check raised no flags."
            : "The reflection check has no results for this submission."}
        </Text>
      ) : null}
      {flagged.map(({ index, step }) => (
        <View key={step.id} style={s.block}>
          <StepTitle index={index} step={step} />
          {step.flags.map((flag) => (
            <FlagCard flag={flag} key={flag.id} notes={notes} />
          ))}
          {step.check ? (
            <Text style={[s.note, { marginTop: 4 }]}>
              {text(step.check.explanation)} {text(step.check.uncertainty)}
            </Text>
          ) : null}
        </View>
      ))}
    </>
  );
};

const Notes = ({ steps }: { steps: SubmissionDetail["steps"] }) => {
  const written = steps.flatMap((step, index) =>
    step.note === "" ? [] : [{ index, step }]
  );
  return (
    <>
      <Heading>Grader notes</Heading>
      {written.length === 0 ? (
        <Text style={s.muted}>You wrote no notes on this submission.</Text>
      ) : null}
      {written.map(({ index, step }) => (
        <View key={step.id} style={{ marginBottom: 8 }}>
          <StepTitle index={index} step={step} />
          <Text style={[s.body, { marginTop: 2 }]}>{text(step.note)}</Text>
        </View>
      ))}
    </>
  );
};

const Essay = ({ detail }: { detail: SubmissionDetail }) => (
  <>
    <Heading>Final essay</Heading>
    <Text style={[s.note, { marginBottom: 6 }]}>
      {text(
        [detail.file, formatWords(detail.match.totalWords)]
          .filter(Boolean)
          .join(" · ")
      )}
      . Text that matches a logged AI answer is highlighted, with the step it
      came from.
    </Text>
    {detail.essay.length === 0 ? (
      <Text style={s.muted}>No final text was saved for this submission.</Text>
    ) : null}
    {detail.essay.map((paragraph) => (
      <Text
        key={paragraph[0]?.start}
        style={{
          ...LEADING,
          color: COLOR.reading,
          lineHeight: 1.55,
          marginBottom: 8,
        }}
      >
        {paragraph.map((run) =>
          run.step === undefined ? (
            text(run.text)
          ) : (
            <Text
              key={run.start}
              style={{
                backgroundColor: detail.steps[run.step]?.flag
                  ? COLOR.flagSoft
                  : COLOR.aiSoft,
              }}
            >
              <Text style={{ color: COLOR.ai, fontSize: 6.5, fontWeight: 600 }}>
                {`S${run.step + 1} `}
              </Text>
              {text(run.text)}
            </Text>
          )
        )}
      </Text>
    ))}
    {detail.match.totalWords === 0 ? null : (
      <Text style={s.body}>{matchTotalsText(detail.match)}</Text>
    )}
    <Text style={[s.note, s.block]}>{matchCaveat(detail.match.minWords)}</Text>
  </>
);

const generatedFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Pacific/Auckland",
});

export const Report = ({
  detail,
  generated,
  sections,
  unshowable = false,
}: {
  detail: SubmissionDetail;
  generated: Date;
  sections: ExportSections;
  unshowable?: boolean;
}) => {
  const { course } = detail.assignment;
  const steps = detail.steps.length;
  return (
    <Document
      author="Pentimento"
      language="en"
      subject="Process report"
      title={text(`${detail.name} · ${detail.assignment.title}`)}
    >
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={s.muted}>Pentimento · Process report</Text>
          <Text style={s.muted}>
            {text(course.code)} · {text(detail.assignment.title)}
          </Text>
        </View>
        <Text style={s.title}>{text(detail.name)}</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>
          {text(detail.email)} · Submitted {detail.submitted} · {steps}{" "}
          {steps === 1 ? "step" : "steps"} over {detail.days}{" "}
          {detail.days === 1 ? "day" : "days"} · {text(course.title)}
        </Text>
        {unshowable ? (
          <Text style={[s.card, s.note]}>
            Some text in this submission uses characters the report font can’t
            show, such as Japanese, Chinese, Korean, Arabic or emoji. They
            appear as {REPLACEMENT} here. The CSV export keeps the original
            text.
          </Text>
        ) : null}
        {sections.summary ? <Summary detail={detail} /> : null}
        {sections.chart ? <Chart steps={detail.steps} /> : null}
        <Overview steps={detail.steps} />
        {sections.steps ? <StepsInFull steps={detail.steps} /> : null}
        {sections.prompts ? <Prompts steps={detail.steps} /> : null}
        {sections.flags ? (
          <Flags detail={detail} notes={sections.notes} />
        ) : null}
        {sections.notes ? <Notes steps={detail.steps} /> : null}
        {sections.essay ? <Essay detail={detail} /> : null}
        <View fixed style={s.footer}>
          <Text>Generated {generatedFormat.format(generated)}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export const renderReport = async (
  props: Omit<Parameters<typeof Report>[0], "unshowable">
) => {
  await loadFonts();
  return renderToBuffer(
    <Report
      {...props}
      unshowable={hasUnshowable(JSON.stringify(props.detail))}
    />
  );
};

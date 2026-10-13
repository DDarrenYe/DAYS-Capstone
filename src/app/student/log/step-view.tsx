import { CritiqueSidebar } from "@/app/student/log/critique-sidebar";
import { MarkedAnswer } from "@/app/student/log/marked-answer";
import { Center, Part, SourceChip } from "@/app/student/log/part";
import { StepActions } from "@/app/student/log/step-actions";
import { answerLabel, marksOf, stepTitle } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { parseCritique } from "@/lib/process";

const logged = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const verdictBadge = {
  partly: { label: "Partly right", variant: "review" },
  right: { label: "Right", variant: "success" },
  wrong: { label: "Wrong", variant: "flag" },
} as const;

const Answer = ({
  heading,
  children,
}: {
  heading: string;
  children: string;
}) => (
  <div>
    <dt className="text-label text-muted-foreground font-emphasis mb-1">
      {heading}
    </dt>
    <dd className="text-reading text-read font-serif whitespace-pre-line">
      {children}
    </dd>
  </div>
);

const Critique = ({ text }: { text: string }) => {
  const parsed = parseCritique(text);
  if (!parsed) {
    return (
      <blockquote className="text-reading border-border-strong text-read border-l-2 pl-3 font-serif whitespace-pre-line">
        {text}
      </blockquote>
    );
  }
  const badge = parsed.verdict ? verdictBadge[parsed.verdict] : null;
  return (
    <dl className="border-border-strong flex flex-col gap-3.5 border-l-2 pl-4">
      <div>
        <dt className="text-label text-muted-foreground font-emphasis mb-1">
          Was the AI right or wrong?
        </dt>
        <dd>
          {badge ? (
            <Badge size="control" variant={badge.variant}>
              {badge.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-meta">Not said</span>
          )}
        </dd>
      </div>
      <Answer heading="How you checked">{parsed.check}</Answer>
      {parsed.sources.length > 0 ? (
        <ul className="-mt-1.5 flex flex-wrap gap-1.5">
          {parsed.sources.map((url) => (
            <li key={url}>
              <a
                className="bg-card shadow-hairline text-body hover:text-foreground flex h-6.5 items-center gap-1.5 rounded-full px-2 text-xs"
                href={URL.canParse(url) ? url : undefined}
                rel="noreferrer noopener"
                target="_blank"
              >
                <Icon className="text-ai size-3.5" name="link" />
                {URL.canParse(url) ? new URL(url).hostname : url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <Answer heading="What you changed">{parsed.change}</Answer>
    </dl>
  );
};

const splitEvidence = (entry: string) => {
  const at = entry.indexOf("” — ");
  if (!entry.startsWith("“") || at === -1) {
    return { note: entry, quote: "" };
  }
  return { note: entry.slice(at + 4), quote: entry.slice(1, at) };
};

const Evidence = ({ text }: { text: string }) => (
  <div className="bg-flag-soft text-flag-ink shadow-flag-ring icon-flag mt-4 rounded-xl px-4 py-3">
    <p className="text-meta font-emphasis flex items-center gap-1.5">
      <Icon className="size-3.5" name="wrong" />
      Errors you reported in the AI’s answer
    </p>
    <ul className="mt-2 flex flex-col gap-2.5">
      {text.split("\n\n").map((entry) => {
        const { quote, note } = splitEvidence(entry);
        return (
          <li className="text-meta" key={entry}>
            {quote ? <q className="font-serif text-base">{quote}</q> : null}
            <p className={quote ? "mt-0.5 opacity-85" : undefined}>{note}</p>
          </li>
        );
      })}
    </ul>
  </div>
);

export const StepView = ({
  step,
  steps,
  projectId,
  userId,
  locked,
}: {
  step: LoggedStep;
  steps: readonly LoggedStep[];
  projectId: string;
  userId: string;
  locked: boolean;
}) => {
  const marks = marksOf(step);
  return (
    <>
      <Center>
        <article className="animate-swap px-10 py-6 max-md:px-4">
          <p className="text-muted-foreground text-meta flex flex-wrap items-center gap-2">
            <span className="bg-card text-foreground shadow-hairline text-label rounded-md px-1.5 py-0.5 font-mono">
              Step {step.step_number}
            </span>
            <span>
              of {steps.length} · {logged.format(new Date(step.created_at))}
            </span>
            <Badge variant="ai">{step.ai_tool}</Badge>
            {step.critique === null ? null : (
              <Badge variant="success">
                <Icon name="check" />
                Saved
              </Badge>
            )}
          </p>
          <div className="mt-2 mb-5 flex items-start gap-3">
            <h1 className="text-title flex-1 font-semibold text-balance">
              {stepTitle(step)}
            </h1>
            {locked ? null : (
              <StepActions
                projectId={projectId}
                saved={step.critique !== null}
                step={step}
                total={steps.length}
                userId={userId}
              />
            )}
          </div>
          <Part
            meta={<SourceChip step={step} />}
            number="01"
            title="What you asked"
          >
            <p className="text-reading text-read font-serif whitespace-pre-wrap">
              {step.prompt}
            </p>
          </Part>
          <Part
            meta={answerLabel(step)}
            number="02"
            title="What the AI answered"
          >
            <div className="bg-muted shadow-hairline text-body max-h-96 overflow-y-auto rounded-lg px-4 py-3.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
              <MarkedAnswer marks={marks} text={step.raw_answer} />
            </div>
          </Part>
          <Part number="03" title="Your critique">
            {step.critique === null ? (
              <p className="text-muted-foreground text-meta">
                No critique was written for this step.
              </p>
            ) : (
              <Critique text={step.critique} />
            )}
            {step.ai_error_evidence ? (
              <Evidence text={step.ai_error_evidence} />
            ) : null}
          </Part>
        </article>
      </Center>
      <CritiqueSidebar sources={0} steps={steps} />
    </>
  );
};

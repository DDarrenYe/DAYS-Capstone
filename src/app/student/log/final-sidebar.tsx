import { matchedPassages } from "@/app/student/log/step-meta";
import type { SavedFinal } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import type { SubmissionMetrics } from "@/lib/submission-metrics";

const Unavailable = ({
  title,
  children,
}: {
  title: string;
  children: string;
}) => (
  <>
    <p className="font-heading mt-2">{title}</p>
    <p className="text-body text-meta mt-1">{children}</p>
  </>
);

const MatchSummary = ({
  metrics,
  saved,
  pending,
}: {
  metrics: SubmissionMetrics;
  saved: SavedFinal;
  pending: boolean;
}) => {
  if (metrics.stepCount === 0) {
    return (
      <Unavailable title="Nothing to compare with">
        You haven’t logged any AI answers, so there is nothing to match your
        text against.
      </Unavailable>
    );
  }
  if (metrics.totalWords === 0) {
    return (
      <Unavailable title="Waiting for a saved version">
        Matches show here once your final version has saved.
      </Unavailable>
    );
  }
  const passages = matchedPassages(metrics, saved.text);
  return (
    <>
      <p className="text-stat font-heading mt-2 tabular-nums">
        {metrics.unmatchedPercent}%
      </p>
      <p className="text-body text-meta mt-1">
        of your saved text doesn’t match your logged AI answers.
      </p>
      <p className="text-muted-foreground mt-1.5 text-xs tabular-nums">
        {metrics.matchedWords} of {metrics.totalWords} words match
      </p>
      {pending ? (
        <p className="text-muted-foreground mt-1.5 text-xs">
          This is version {saved.version}, your last save. Changes that haven’t
          saved yet aren’t counted.
        </p>
      ) : null}
      {passages.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {passages.map(({ start, stepNumber, text, words }) => (
            <li key={start}>
              <p className="text-muted-foreground text-label mb-0.5 tabular-nums">
                Step {stepNumber} · {words} words
              </p>
              <blockquote className="bg-ai-wash shadow-traced text-body text-meta line-clamp-3 rounded-xs px-1.5 py-1">
                {text}
              </blockquote>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
};

export const FinalSidebar = ({
  metrics,
  pending,
  saved,
}: {
  metrics: SubmissionMetrics;
  pending: boolean;
  saved: SavedFinal;
}) => (
  <aside className="flex flex-col gap-4.5 px-4.5 py-4.5 max-lg:border-t lg:overflow-y-auto lg:border-l">
    <section className="shadow-hairline rounded-xl px-3.5 py-3">
      <h2 className="text-label text-muted-foreground font-emphasis">
        Matches with your logged AI
      </h2>
      <MatchSummary metrics={metrics} pending={pending} saved={saved} />
    </section>

    <section className="bg-muted text-body text-meta rounded-xl px-3.5 py-3">
      <h2 className="text-foreground font-heading mb-1 flex items-center gap-1.75">
        <Icon name="eye" />
        What a match means
      </h2>
      A match is an unbroken run of words from a logged answer, so reworded text
      doesn’t match and a common phrase can. Text that doesn’t match your logged
      AI answers isn’t proof that you wrote it, and a match isn’t proof that you
      didn’t. Your grader reads the matches next to your critiques.
    </section>
  </aside>
);

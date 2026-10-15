import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { Icon } from "@/components/icon";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatWords } from "@/lib/process";
import { cn } from "@/lib/utils";

const Match = ({
  flagged,
  hot,
  index,
  onSelect,
  text,
  title,
  traced,
}: {
  flagged: boolean;
  hot: boolean;
  index: number;
  onSelect: (index: number) => void;
  text: string;
  title: string;
  traced: boolean;
}) => (
  <mark
    className={cn(
      "rounded-xs bg-transparent box-decoration-clone py-px text-inherit transition duration-160",
      traced &&
        (flagged
          ? "bg-flag-soft/60 shadow-flagged"
          : "bg-ai-wash shadow-traced"),
      traced &&
        hot &&
        (flagged
          ? "bg-flag-soft shadow-flagged-hot"
          : "bg-ai-soft shadow-traced-hot")
    )}
  >
    <button
      aria-label={`Open step ${index + 1}, ${title}`}
      className={cn(
        "text-micro absolute -left-7.5 mt-1 cursor-pointer rounded px-1 font-mono leading-4",
        flagged ? "bg-flag-soft text-flag-ink" : "bg-ai-soft text-ai-ink",
        "transition-visibility duration-160",
        !traced && "invisible opacity-0"
      )}
      onClick={() => onSelect(index)}
      type="button"
    >
      S{index + 1}
    </button>
    {text}
  </mark>
);

const Totals = ({ match }: { match: SubmissionDetail["match"] }) => (
  <div className="text-body text-meta flex flex-col gap-1.5 border-t px-4.5 py-3">
    {match.totalWords === 0 ? null : (
      <p className="tabular-nums">
        {match.matchedWords.toLocaleString("en")} of{" "}
        {formatWords(match.totalWords)} match a logged AI answer.{" "}
        {match.unmatchedWords.toLocaleString("en")} don’t (
        {match.unmatchedPercent}%).
      </p>
    )}
    <p className="text-muted-foreground">
      A match is a run of at least {match.minWords} words that also appears in a
      logged AI answer. A quote with a word changed in every few words, or a
      paraphrase, doesn’t match, and a common phrase can. Words that don’t match
      aren’t proof the student wrote them, and a match isn’t proof they didn’t.
      Read matches next to the critique.
    </p>
  </div>
);

export const EssayCard = ({
  detail,
  focus,
  onSelect,
  onTracedChange,
  traced,
}: {
  detail: SubmissionDetail;
  focus: number;
  onSelect: (index: number) => void;
  onTracedChange: (traced: boolean) => void;
  traced: boolean;
}) => (
  <Card>
    <CardHeader>
      <Icon name="essay" />
      <CardTitle>Final essay</CardTitle>
      <span className="text-faint text-label font-mono max-sm:hidden">
        {[detail.file, formatWords(detail.match.totalWords)]
          .filter(Boolean)
          .join(" · ")}
      </span>
      <CardAction>
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Base UI Switch renders the control inside the label */}
        <label className="flex cursor-pointer items-center gap-2.25">
          Highlight matches
          <Switch checked={traced} onCheckedChange={onTracedChange} />
        </label>
      </CardAction>
    </CardHeader>
    <div className="px-10 pt-4.5 pb-3 pl-18 max-sm:px-4 max-sm:pl-12">
      {detail.essay.length === 0 ? (
        <p className="text-muted-foreground">
          No final text was saved for this submission.
        </p>
      ) : null}
      {detail.essay.map((paragraph, number) => (
        <p
          className="text-read text-reading relative mb-3.5 font-serif text-pretty"
          key={paragraph[0]?.start}
        >
          <span className="text-border-strong text-micro absolute top-1 -left-13 font-mono max-sm:-left-9">
            ¶{number + 1}
          </span>
          {paragraph.map((run) => {
            const index = run.step;
            const step = index === undefined ? undefined : detail.steps[index];
            if (index === undefined || !step) {
              return run.text;
            }
            return (
              <Match
                flagged={Boolean(step.flag)}
                hot={index === focus}
                index={index}
                key={run.start}
                onSelect={onSelect}
                text={run.text}
                title={step.title}
                traced={traced}
              />
            );
          })}
        </p>
      ))}
    </div>
    <Totals match={detail.match} />
  </Card>
);

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTE } from "@/lib/data/schemas";
import { useReviewFlag } from "@/lib/data/use-mutations";
import { FLAG_STATE_LABEL } from "@/lib/flag-review";
import type { FlagState, FlagView } from "@/lib/flag-review";

const whenFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
});

const When = ({ at }: { at: string }) => (
  <time dateTime={at} suppressHydrationWarning>
    {whenFormat.format(new Date(at))}
  </time>
);

const DecisionRecord = ({ flag }: { flag: FlagView }) => (
  <>
    {flag.reviewedAt ? (
      <p className="text-label font-emphasis">
        {flag.state === "open" ? "Reopened" : FLAG_STATE_LABEL[flag.state]} by
        you · <When at={flag.reviewedAt} />
      </p>
    ) : null}
    {flag.note ? (
      <p className="whitespace-pre-line">
        <span className="font-emphasis">Note:</span> {flag.note}
      </p>
    ) : null}
    {flag.earlier.length > 0 ? (
      <ul className="text-label opacity-70">
        {flag.earlier.map(({ at, note, state }) => (
          <li key={`${at}-${state}`}>
            {state === "open" ? "Reopened" : FLAG_STATE_LABEL[state]} ·{" "}
            <When at={at} />
            {note ? ` · ${note}` : ""}
          </li>
        ))}
      </ul>
    ) : null}
  </>
);

/*
  Dismiss, add to feedback or undo, with an optional note. The decision is saved on the server, which records
  who decided and when, then the page is read again so every count follows. Key this by the flag's `reviewedAt`
  so the note box starts from what was saved.
*/
export const FlagDecision = ({
  flag,
  onDecided,
  subject,
}: {
  flag: FlagView;
  onDecided?: () => void;
  subject: string;
}) => {
  const router = useRouter();
  const review = useReviewFlag();
  const [refreshing, startRefresh] = useTransition();
  const [draft, setDraft] = useState(flag.note);
  const [noting, setNoting] = useState(false);
  const busy = review.isPending || refreshing;
  const note = draft.trim();
  const decide = (state: FlagState) =>
    review.mutate(
      { flagId: flag.id, note, state },
      {
        onSuccess: () => {
          onDecided?.();
          startRefresh(() => router.refresh());
        },
      }
    );
  const other: FlagState =
    flag.state === "dismissed" ? "added_to_feedback" : "dismissed";

  return (
    <div className="flex flex-col gap-1.5">
      <DecisionRecord flag={flag} />
      <div className="flex flex-wrap items-center gap-1.5">
        {flag.state === "open" ? (
          <>
            <Button
              aria-label={`Dismiss ${subject}`}
              disabled={busy}
              onClick={() => decide("dismissed")}
              size="sm"
              variant="outline"
            >
              Dismiss
            </Button>
            <Button
              aria-label={`Add ${subject} to feedback`}
              disabled={busy}
              onClick={() => decide("added_to_feedback")}
              size="sm"
            >
              Add to feedback
            </Button>
          </>
        ) : (
          <>
            <Button
              aria-label={
                other === "dismissed"
                  ? `Dismiss ${subject} instead`
                  : `Add ${subject} to feedback instead`
              }
              disabled={busy}
              onClick={() => decide(other)}
              size="sm"
              variant="outline"
            >
              {other === "dismissed"
                ? "Dismiss instead"
                : "Add to feedback instead"}
            </Button>
            <Button
              aria-label={`Undo the decision on ${subject}`}
              disabled={busy}
              onClick={() => decide("open")}
              size="sm"
              variant="ghost"
            >
              Undo
            </Button>
          </>
        )}
        <Button
          aria-expanded={noting}
          aria-label={`${flag.note ? "Edit the note on" : "Add a note to"} ${subject}`}
          disabled={busy}
          onClick={() => setNoting((current) => !current)}
          size="sm"
          variant="ghost"
        >
          <Icon name="note" />
          {flag.note ? "Edit note" : "Note"}
        </Button>
        <span aria-live="polite" className="text-label opacity-70">
          {busy ? "Saving…" : ""}
        </span>
      </div>
      {noting ? (
        <form
          className="flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            decide(flag.state);
          }}
        >
          <Textarea
            aria-label={`Note on ${subject}`}
            className="max-h-40 overflow-y-auto"
            density="compact"
            disabled={busy}
            maxLength={MAX_NOTE}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              flag.state === "open"
                ? "Optional. Saved with your decision."
                : "Optional note for the report."
            }
            rows={1}
            value={draft}
            voice="machine"
          />
          {flag.state !== "open" && note !== flag.note ? (
            <Button disabled={busy} size="sm" type="submit">
              Save note
            </Button>
          ) : null}
        </form>
      ) : null}
      {review.error ? (
        <p className="text-flag-ink text-label" role="alert">
          {review.error.message}
        </p>
      ) : null}
    </div>
  );
};

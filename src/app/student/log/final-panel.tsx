import { useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { ConfirmDialog } from "@/app/student/log/confirm-dialog";
import { FinalSidebar } from "@/app/student/log/final-sidebar";
import { Center, Notice } from "@/app/student/log/part";
import { savedTime } from "@/app/student/log/step-meta";
import type { SavedFinal } from "@/app/student/log/step-meta";
import { SubmitCard } from "@/app/student/log/submit-card";
import type {
  FinalStatus,
  useFinalDraft,
} from "@/app/student/log/use-final-draft";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MAX_TEXT } from "@/lib/data/schemas";
import {
  useExtractFinal,
  useSubmitProject,
  WriteError,
} from "@/lib/data/use-mutations";
import { countWords } from "@/lib/process";
import type { SubmissionMetrics } from "@/lib/submission-metrics";
import { cn } from "@/lib/utils";

const DOCX_TYPES =
  ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const statusLabel = (status: FinalStatus, saved: SavedFinal) => {
  if (status === "saving") {
    return "Saving…";
  }
  if (status === "unsaved") {
    return "Unsaved changes";
  }
  if (status === "saved") {
    return saved.createdAt
      ? `Saved at ${savedTime(saved.createdAt)}`
      : "Nothing saved yet";
  }
  return "Not saved";
};

const SaveProblem = ({
  final,
}: {
  final: ReturnType<typeof useFinalDraft>;
}) => {
  if (final.status === "conflict") {
    return (
      <Notice>
        <span className="block">
          Your final version was saved somewhere else, such as another tab or
          device, since you opened it. Your text here is not saved yet.
        </span>
        <span className="mt-2 flex flex-wrap gap-2">
          <Button
            disabled={final.refreshing}
            onClick={() => final.keepMine()}
            size="sm"
            variant="outline"
          >
            Save mine over it
          </Button>
          <Button
            disabled={final.refreshing}
            onClick={() => final.adoptSaved()}
            size="sm"
            variant="outline"
          >
            Use the saved version
          </Button>
        </span>
      </Notice>
    );
  }
  if (final.status === "failed") {
    return (
      <Notice>
        <span className="block">
          {final.error} Your text is still here, and kept in this browser.
        </span>
        <Button
          className="mt-2"
          onClick={() => final.retry()}
          size="sm"
          variant="outline"
        >
          Try saving again
        </Button>
      </Notice>
    );
  }
  return null;
};

export const FinalPanel = ({
  final,
  saved,
  locked,
  metrics,
  projectId,
  userId,
  blockers,
}: {
  final: ReturnType<typeof useFinalDraft>;
  saved: SavedFinal;
  locked: boolean;
  metrics: SubmissionMetrics;
  projectId: string;
  userId: string;
  blockers: string[];
}) => {
  const { stepCount } = metrics;
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const extract = useExtractFinal();
  const submit = useSubmitProject(userId);
  const [incoming, setIncoming] = useState<{
    filename: string;
    text: string;
  } | null>(null);
  const waiting = [
    ...(extract.isPending || incoming
      ? ["Finish importing your document."]
      : []),
    ...(final.status === "saved"
      ? []
      : ["Wait for your final version to finish saving."]),
  ];

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file) {
      return;
    }
    const imported = await extract.mutateAsync(file).catch(() => null);
    if (!imported) {
      return;
    }
    if (final.text.trim() === "") {
      final.change(imported);
    } else {
      setIncoming(imported);
    }
  };

  const importError = () => {
    const { error } = extract;
    if (!error) {
      return null;
    }
    const reason =
      error instanceof WriteError
        ? error.message
        : "We couldn’t upload that file. Check that it’s a .docx under 4 MB.";
    return `${reason} Your text is unchanged.`;
  };
  const problem = importError();

  return (
    <>
      <Center>
        <article className="animate-swap mx-auto w-full max-w-3xl px-10 py-6 max-md:px-4">
          <p className="text-muted-foreground text-meta flex flex-wrap items-center gap-2">
            <span className="bg-card text-foreground shadow-hairline text-label rounded-md px-1.5 py-0.5 font-mono">
              Final version
            </span>
            <span>
              after {stepCount} logged {stepCount === 1 ? "step" : "steps"}
            </span>
          </p>
          <h1 className="text-title mt-2 font-semibold text-balance">
            Your final version
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-xl text-pretty">
            {locked
              ? "This log is submitted, so your final version is locked."
              : "Write or paste the essay you’re handing in, or bring in a Word document. It saves as you type."}
          </p>

          <Card className="mt-5" variant="raised">
            <div className="bg-muted/60 flex flex-wrap items-center gap-3 rounded-t-xl border-b px-4 py-3">
              <span className="text-body text-label font-emphasis flex items-center gap-1.75">
                <Icon className="size-3.5" name={locked ? "lock" : "essay"} />
                {final.filename
                  ? `From ${final.filename}`
                  : "Typed or pasted by you"}
              </span>
              {locked ? null : (
                <>
                  <input
                    accept={DOCX_TYPES}
                    className="sr-only"
                    onChange={choose}
                    ref={picker}
                    tabIndex={-1}
                    type="file"
                  />
                  <Button
                    className="ml-auto"
                    disabled={extract.isPending || submit.isPending}
                    onClick={() => picker.current?.click()}
                    variant="outline"
                  >
                    <Icon className="size-3.5" name="export" />
                    {extract.isPending ? "Reading…" : "Import a .docx"}
                  </Button>
                </>
              )}
            </div>
            <div className="p-4">
              <label className="sr-only" htmlFor={id}>
                Final version text
              </label>
              <Textarea
                className="min-h-96"
                id={id}
                maxLength={MAX_TEXT}
                onChange={(event) => final.change({ text: event.target.value })}
                placeholder="Paste or type your final essay"
                readOnly={locked || submit.isPending}
                value={final.text}
              />
              <div className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-3 text-xs">
                <span className="font-mono tabular-nums">
                  {countWords(final.text)} words
                </span>
                <output
                  className={cn(
                    "ml-auto flex items-center gap-1.5",
                    final.status === "failed" || final.status === "conflict"
                      ? "text-flag-ink"
                      : undefined
                  )}
                >
                  {locked ? "Submitted" : statusLabel(final.status, saved)}
                </output>
              </div>
              {problem ? <Notice>{problem}</Notice> : null}
              <SaveProblem final={final} />
            </div>
          </Card>
          {locked ? null : (
            <SubmitCard
              blockers={[...blockers, ...waiting]}
              projectId={projectId}
              submit={submit}
            />
          )}
        </article>
      </Center>
      <FinalSidebar
        metrics={metrics}
        pending={final.status !== "saved"}
        saved={saved}
      />
      <ConfirmDialog
        confirm="Replace text"
        description={`Importing ${incoming?.filename ?? "this document"} replaces the text in the editor.`}
        onConfirm={() => {
          if (incoming) {
            final.change(incoming);
          }
          setIncoming(null);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setIncoming(null);
          }
        }}
        open={incoming !== null}
        pendingLabel="Replacing…"
        title="Replace your text?"
      />
    </>
  );
};

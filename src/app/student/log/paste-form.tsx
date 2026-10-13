import { useId } from "react";
import type { KeyboardEvent } from "react";

import { Notice } from "@/app/student/log/part";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { useAddStep } from "@/lib/data/use-mutations";
import { countWords } from "@/lib/process";

export const PasteForm = ({
  projectId,
  userId,
  tool,
  prompt,
  answer,
  onEdit,
  onAdded,
}: {
  projectId: string;
  userId: string;
  tool: string;
  prompt: string;
  answer: string;
  onEdit: (patch: { prompt?: string; answer?: string }) => void;
  onAdded: (firstStep: number | undefined) => void;
}) => {
  const adding = useAddStep(userId);
  const id = useId();
  const ready =
    !adding.isPending &&
    tool.trim() !== "" &&
    prompt.trim() !== "" &&
    answer.trim() !== "";

  const add = async () => {
    if (!ready) {
      return;
    }
    const result = await adding
      .mutateAsync({ aiTool: tool, projectId, prompt, rawAnswer: answer })
      .catch(() => null);
    if (result) {
      onEdit({ answer: "", prompt: "" });
      onAdded(result.firstStep);
    }
  };

  const shortcut = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        add();
      }}
    >
      <div>
        <label
          className="text-body text-label font-emphasis mb-1.25 block"
          htmlFor={`${id}-prompt`}
        >
          What you asked
        </label>
        <Textarea
          id={`${id}-prompt`}
          onChange={(event) => onEdit({ prompt: event.target.value })}
          onKeyDown={shortcut}
          placeholder="Paste your prompt"
          value={prompt}
        />
      </div>
      <div>
        <div className="mb-1.25 flex items-baseline">
          <label
            className="text-body text-label font-emphasis"
            htmlFor={`${id}-answer`}
          >
            What the AI answered
          </label>
          <span className="text-faint text-micro ml-auto font-mono tabular-nums">
            {countWords(answer)} words
          </span>
        </div>
        <Textarea
          id={`${id}-answer`}
          onChange={(event) => onEdit({ answer: event.target.value })}
          onKeyDown={shortcut}
          placeholder="Paste the answer"
          value={answer}
          voice="machine"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Icon className="size-3.5" name="lock" />
          Saved exactly as pasted
        </span>
        <Button className="ml-auto" disabled={!ready} type="submit">
          {adding.isPending ? "Adding…" : "Add step"}
          <Kbd>⌘↵</Kbd>
        </Button>
      </div>
      {adding.error ? (
        <Notice>{adding.error.message} What you pasted is still here.</Notice>
      ) : null}
    </form>
  );
};

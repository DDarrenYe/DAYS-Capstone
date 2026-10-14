import { useId, useState } from "react";

import { Notice } from "@/app/student/log/part";
import { PreviewList, PreviewSkeleton } from "@/app/student/log/preview-list";
import { Icon } from "@/components/icon";
import { SwapText } from "@/components/swap-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImportSteps, usePreviewImport } from "@/lib/data/use-mutations";

export const LinkImport = ({
  projectId,
  userId,
  url,
  onUrl,
  onAdded,
}: {
  projectId: string;
  userId: string;
  url: string;
  onUrl: (url: string) => void;
  onAdded: (firstStep: number) => void;
}) => {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState("");
  const preview = usePreviewImport();
  const importing = useImportSteps(userId);
  const id = useId();
  const fresh = preview.data?.steps.filter(({ saved }) => !saved) ?? [];

  const read = async () => {
    setNotice("");
    const found = await preview
      .mutateAsync({ projectId, url })
      .catch(() => null);
    setChosen(
      new Set(
        found?.steps.filter(({ saved }) => !saved).map(({ id: step }) => step)
      )
    );
  };

  const add = async () => {
    if (!preview.data || chosen.size === 0) {
      return;
    }
    const result = await importing
      .mutateAsync({ projectId, stepIds: [...chosen], url: preview.data.link })
      .catch(() => null);
    if (!result) {
      return;
    }
    if (result.added === 0 || result.firstStep === undefined) {
      setNotice("Those steps are already in your log.");
      return;
    }
    onUrl("");
    preview.reset();
    onAdded(result.firstStep);
  };

  const toggle = (step: string, on: boolean) =>
    setChosen((current) => {
      const next = new Set(current);
      if (on) {
        next.add(step);
      } else {
        next.delete(step);
      }
      return next;
    });

  return (
    <>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          read();
        }}
      >
        <label className="sr-only" htmlFor={id}>
          ChatGPT share link
        </label>
        <div className="relative flex-1">
          <Icon
            className="text-faint pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            name="link"
          />
          <Input
            id={id}
            inputMode="url"
            inset="icon"
            onChange={(event) => {
              onUrl(event.target.value);
              preview.reset();
            }}
            placeholder="https://chatgpt.com/share/…"
            value={url}
          />
        </div>
        <Button
          disabled={url.trim() === "" || preview.isPending}
          size="lg"
          type="submit"
          variant="outline"
        >
          <SwapText>{preview.isPending ? "Reading…" : "Preview"}</SwapText>
        </Button>
      </form>
      <p className="text-muted-foreground mt-2 text-xs">
        Use the link from ChatGPT’s Share button. Nothing is saved until you add
        the steps.
      </p>
      {preview.error ? <Notice>{preview.error.message}</Notice> : null}
      {preview.isPending ? <PreviewSkeleton /> : null}
      {preview.data ? (
        <PreviewList
          adding={importing.isPending}
          chosen={chosen}
          error={importing.error?.message}
          notice={notice}
          omitted={preview.data.omitted}
          onAdd={add}
          onToggle={toggle}
          onToggleAll={() =>
            setChosen(
              chosen.size === fresh.length
                ? new Set()
                : new Set(fresh.map(({ id: step }) => step))
            )
          }
          steps={preview.data.steps}
        />
      ) : null}
    </>
  );
};

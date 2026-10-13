import { useEffect, useEffectEvent, useRef, useState } from "react";

import { MARKS, MarkedAnswer } from "@/app/student/log/marked-answer";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { addMark } from "@/lib/marks";
import type { Mark, MarkKind } from "@/lib/marks";
import { cn } from "@/lib/utils";

const offsetWithin = (root: Node, node: Node, offset: number) => {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  return range.toString().length;
};

const MarkList = ({
  text,
  marks,
  onChange,
}: {
  text: string;
  marks: readonly Mark[];
  onChange: (marks: Mark[]) => void;
}) => (
  <ul className="mt-3 flex flex-col gap-2">
    {marks.map((item, index) => {
      const kind = MARKS.find(({ kind: name }) => name === item.kind);
      return (
        <li
          className="bg-card shadow-hairline animate-rise relative flex flex-col gap-2 overflow-hidden rounded-lg py-2 pr-2 pl-4"
          key={`${item.start}-${item.kind}`}
        >
          <span
            aria-hidden="true"
            className={cn("absolute inset-y-0 left-0 w-0.75", kind?.bar)}
          />
          <div className="text-meta flex items-center gap-2">
            <span className={kind?.accent}>
              <Icon name={kind?.icon ?? "note"} />
            </span>
            <b className="font-emphasis whitespace-nowrap">{kind?.label}</b>
            <q className="text-muted-foreground min-w-0 truncate font-serif">
              {text.slice(item.start, item.end)}
            </q>
            <Button
              aria-label={`Remove mark ${index + 1}`}
              className="ml-auto"
              onClick={() => onChange(marks.filter((_, at) => at !== index))}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Icon className="size-3.5" name="x" />
            </Button>
          </div>
          {item.kind === "wrong" ? (
            <Input
              aria-label={`What is wrong with mark ${index + 1}?`}
              density="compact"
              onChange={(event) =>
                onChange(
                  marks.map((entry, at) =>
                    at === index
                      ? { ...entry, note: event.target.value }
                      : entry
                  )
                )
              }
              placeholder="What’s wrong with it? Your grader reads this."
              value={item.note ?? ""}
            />
          ) : null}
        </li>
      );
    })}
  </ul>
);

export const AnswerMarker = ({
  text,
  marks,
  onChange,
}: {
  text: string;
  marks: readonly Mark[];
  onChange: (marks: Mark[]) => void;
}) => {
  const [pending, setPending] = useState<{
    start: number;
    end: number;
    rect: DOMRect;
  } | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const onSelectionEnd = useEffectEvent(() => {
    const root = answerRef.current;
    const selection = globalThis.getSelection();
    if (!(root && selection) || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      return;
    }
    setPending({
      end: offsetWithin(root, range.endContainer, range.endOffset),
      rect: range.getBoundingClientRect(),
      start: offsetWithin(root, range.startContainer, range.startOffset),
    });
  });

  useEffect(() => {
    const handle = () => onSelectionEnd();
    document.addEventListener("pointerup", handle);
    document.addEventListener("keyup", handle);
    return () => {
      document.removeEventListener("pointerup", handle);
      document.removeEventListener("keyup", handle);
    };
  }, []);

  const mark = (kind: MarkKind) => {
    if (pending) {
      onChange(
        addMark(marks, { end: pending.end, kind, start: pending.start })
      );
    }
    globalThis.getSelection()?.removeAllRanges();
    setPending(null);
  };

  return (
    <>
      <div
        className="bg-muted shadow-hairline text-body max-h-96 overflow-y-auto rounded-lg px-4 py-3.5 text-sm leading-relaxed break-words whitespace-pre-wrap"
        ref={answerRef}
      >
        <MarkedAnswer marks={marks} text={text} />
      </div>
      <p className="text-muted-foreground mt-2 flex items-start gap-1.5 text-xs">
        <Icon className="mt-px size-3.5 shrink-0" name="note" />
        <span>
          Select any passage to mark it as wrong, unsourced or used. Marks are
          your own report, not a check by the tool.
        </span>
      </p>
      {marks.length > 0 ? (
        <MarkList marks={marks} onChange={onChange} text={text} />
      ) : null}
      <DropdownMenu
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
        open={pending !== null}
      >
        <DropdownMenuContent
          align="start"
          anchor={
            pending ? { getBoundingClientRect: () => pending.rect } : null
          }
          className="w-63"
          onKeyDown={(event) => {
            const choice = MARKS[Number(event.key) - 1];
            if (choice) {
              mark(choice.kind);
            }
          }}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mark this passage</DropdownMenuLabel>
            {MARKS.map((item, index) => (
              <DropdownMenuItem key={item.kind} onClick={() => mark(item.kind)}>
                <span className={item.accent}>
                  <Icon name={item.icon} />
                </span>
                {item.label}
                <Kbd>{index + 1}</Kbd>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

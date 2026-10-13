import type { IconName } from "@/components/icon";
import { splitMarks } from "@/lib/marks";
import type { Mark, MarkKind } from "@/lib/marks";
import { cn } from "@/lib/utils";

export const MARKS: {
  kind: MarkKind;
  label: string;
  icon: IconName;
  accent: string;
  bar: string;
  style: string;
}[] = [
  {
    accent: "icon-flag",
    bar: "bg-flag",
    icon: "wrong",
    kind: "wrong",
    label: "It’s wrong",
    style: "decoration-flag underline decoration-wavy underline-offset-4",
  },
  {
    accent: "icon-review",
    bar: "bg-review",
    icon: "unsourced",
    kind: "unsourced",
    label: "No source I could find",
    style:
      "decoration-review underline decoration-dotted decoration-2 underline-offset-4",
  },
  {
    accent: "icon-ai",
    bar: "bg-ai",
    icon: "used",
    kind: "used",
    label: "I used this in my essay",
    style: "bg-ai-wash shadow-traced rounded-xs",
  },
];

export const MarkedAnswer = ({
  text,
  marks,
}: {
  text: string;
  marks: readonly Mark[];
}) =>
  splitMarks(text, marks).map((run) => {
    if (!run.mark) {
      return run.text;
    }
    const { kind, start } = run.mark;
    return (
      <mark
        className={cn(
          "bg-transparent text-inherit",
          MARKS.find((item) => item.kind === kind)?.style
        )}
        key={`${start}-${kind}`}
      >
        {run.text}
      </mark>
    );
  });

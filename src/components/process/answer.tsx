import type { Segment } from "@/lib/process";

/* An AI answer as logged: cobalt where it reached the essay, struck through where the student caught an error. */
export const Answer = ({ segments }: { segments: readonly Segment[] }) =>
  segments.map((segment) => {
    if (segment.kind === "carried") {
      return (
        <mark
          className="bg-ai-soft shadow-traced rounded-xs box-decoration-clone text-inherit"
          key={segment.text}
        >
          {segment.text}
        </mark>
      );
    }
    if (segment.kind === "error") {
      return (
        <s
          className="text-muted-foreground decoration-success decoration-2"
          key={segment.text}
        >
          {segment.text}
        </s>
      );
    }
    return segment.text;
  });

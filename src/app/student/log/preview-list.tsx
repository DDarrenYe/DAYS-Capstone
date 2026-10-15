import { Notice } from "@/app/student/log/part";
import { stepTitle } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { SwapText } from "@/components/swap-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_TEXT } from "@/lib/data/schemas";
import { countWords } from "@/lib/process";

interface Found {
  id: string;
  prompt: string;
  answer: string;
  saved: boolean;
}

const stepCount = (count: number) =>
  `${count} ${count === 1 ? "step" : "steps"}`;

const snippet = (text: string) => {
  const flat = text.replaceAll(/\s+/gu, " ").trim();
  return flat.length > 120 ? `${flat.slice(0, 120)}…` : flat;
};

export const PreviewSkeleton = () => (
  <div
    aria-hidden="true"
    className="shadow-hairline mt-3.5 overflow-hidden rounded-xl"
  >
    {["first", "second", "third"].map((row) => (
      <div
        className="flex animate-pulse items-center gap-3 border-b px-3.5 py-3 last:border-b-0 motion-reduce:animate-none"
        key={row}
      >
        <span className="bg-muted size-4.5 rounded-sm" />
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="bg-muted h-3 w-3/5 rounded-full" />
          <span className="bg-muted h-2.5 w-4/5 rounded-full" />
        </span>
      </div>
    ))}
  </div>
);

const Row = ({
  item,
  index,
  checked,
  onToggle,
}: {
  item: Found;
  index: number;
  checked: boolean;
  onToggle: (on: boolean) => void;
}) => (
  <li className="animate-rise border-b last:border-b-0">
    <label className="has-data-checked:bg-ai-wash hover:bg-muted/60 flex cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors duration-150 has-data-disabled:cursor-default has-data-disabled:hover:bg-transparent">
      <Checkbox
        checked={checked}
        className="mt-0.5"
        disabled={item.saved}
        onCheckedChange={onToggle}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-faint text-micro font-mono tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <b className="text-control line-clamp-1 font-medium">
            {stepTitle(item)}
          </b>
        </span>
        <span className="text-muted-foreground text-meta mt-0.5 line-clamp-1 pl-5.5">
          {snippet(item.answer)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {item.saved ? (
          <Badge variant="success">
            <Icon name="check" />
            In your log
          </Badge>
        ) : (
          <Badge variant="ai">New</Badge>
        )}
        <span className="text-faint text-micro font-mono tabular-nums">
          {countWords(item.answer)} words
        </span>
      </span>
    </label>
  </li>
);

export const PreviewList = ({
  steps,
  omitted,
  chosen,
  adding,
  notice,
  error,
  onToggle,
  onToggleAll,
  onAdd,
}: {
  steps: readonly Found[];
  omitted: number;
  chosen: ReadonlySet<string>;
  adding: boolean;
  notice: string;
  error: string | undefined;
  onToggle: (id: string, on: boolean) => void;
  onToggleAll: () => void;
  onAdd: () => void;
}) => {
  const fresh = steps.filter(({ saved }) => !saved);
  return (
    <section
      aria-label="Steps found in this chat"
      className="shadow-hairline animate-rise mt-3.5 min-w-0 overflow-hidden rounded-xl"
    >
      <header className="bg-muted/70 flex min-h-10 items-center gap-2.5 border-b px-3.5">
        <h3 className="text-meta font-emphasis">
          {stepCount(steps.length)} in this chat
        </h3>
        <span className="text-muted-foreground text-label bg-card shadow-hairline hidden items-center gap-1 rounded-md px-1.5 py-0.5 font-mono sm:flex">
          <Icon className="text-ai size-3" name="link" />
          chatgpt.com
        </span>
        {fresh.length > 1 ? (
          <Button
            className="ml-auto"
            onClick={onToggleAll}
            size="sm"
            variant="ghost"
          >
            {chosen.size === fresh.length ? "Clear" : "Select all"}
          </Button>
        ) : null}
      </header>
      <ul className="stagger-children">
        {steps.map((item, index) => (
          <Row
            checked={chosen.has(item.id)}
            index={index}
            item={item}
            key={item.id}
            onToggle={(on) => onToggle(item.id, on)}
          />
        ))}
      </ul>
      {omitted > 0 ? (
        <p className="text-muted-foreground bg-review-soft/60 text-meta border-t px-3.5 py-2">
          {stepCount(omitted)} longer than {MAX_TEXT.toLocaleString("en")}{" "}
          characters {omitted === 1 ? "was" : "were"} left out. Paste{" "}
          {omitted === 1 ? "it" : "them"} on the Paste text tab.
        </p>
      ) : null}
      <footer className="bg-muted/40 flex flex-wrap items-center gap-3 border-t px-3.5 py-3">
        <span className="text-muted-foreground text-meta tabular-nums">
          {chosen.size} of {fresh.length} new selected
        </span>
        {notice ? (
          <span className="text-muted-foreground text-xs">{notice}</span>
        ) : null}
        <Button
          className="ml-auto"
          disabled={chosen.size === 0 || adding}
          onClick={onAdd}
        >
          <SwapText>
            {adding ? "Adding…" : `Add ${stepCount(chosen.size)}`}
          </SwapText>
          <Icon name="right" />
        </Button>
      </footer>
      {error ? (
        <div className="px-3.5 pb-3">
          <Notice>{error}</Notice>
        </div>
      ) : null}
    </section>
  );
};

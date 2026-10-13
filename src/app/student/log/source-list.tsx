import { useId, useState } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SourceList = ({
  sources,
  onChange,
}: {
  sources: readonly string[];
  onChange: (sources: string[]) => void;
}) => {
  const [source, setSource] = useState("");
  const id = useId();
  const url = source.trim();

  const add = () => {
    if (URL.canParse(url) && !sources.includes(url)) {
      onChange([...sources, url]);
      setSource("");
    }
  };

  return (
    <ul className="mt-2 flex flex-wrap items-center gap-1.5">
      {sources.map((item) => (
        <li
          className="bg-card shadow-hairline text-body animate-rise flex h-6.5 items-center gap-1.5 rounded-full pr-1 pl-2 text-xs"
          key={item}
        >
          <Icon className="text-ai size-3.5" name="link" />
          {URL.canParse(item) ? new URL(item).hostname : item}
          <Button
            aria-label={`Remove ${item}`}
            onClick={() => onChange(sources.filter((entry) => entry !== item))}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Icon className="size-3" name="x" />
          </Button>
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={id}>
          Add a source link
        </label>
        <Input
          className="w-60"
          density="compact"
          id={id}
          onChange={(event) => setSource(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Add a source link"
          type="url"
          value={source}
        />
        <Button
          disabled={!URL.canParse(url)}
          onClick={add}
          size="sm"
          type="button"
          variant="outline"
        >
          Add
        </Button>
      </li>
    </ul>
  );
};

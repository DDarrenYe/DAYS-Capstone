import { z } from "zod";

import { MAX_TEXT } from "@/lib/data/schemas";
import { ImportError } from "@/lib/import/errors";

export interface ShareLink {
  id: string;
  url: URL;
}

export interface SharedStep {
  id: string;
  prompt: string;
  answer: string;
}

type Value =
  | string
  | number
  | boolean
  | null
  | Value[]
  | { [key: string]: Value };

const HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);
const ROUTE = "routes/share.$shareId.($action)";
const PAYLOAD = "streamController.enqueue(";
const TEXT_TYPES = new Set(["text", "multimodal_text"]);
export const MAX_SHARED_STEPS = 200;

export const parseShareLink = (input: string): ShareLink => {
  const text = input.trim();
  if (!URL.canParse(text)) {
    throw new ImportError("invalid_link");
  }
  const url = new URL(text);
  if (
    url.protocol !== "https:" ||
    !HOSTS.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new ImportError("unsupported_host");
  }
  const [section, shareId, ...rest] = url.pathname.split("/").filter(Boolean);
  const guid = z.guid().safeParse(shareId);
  if (section !== "share" || rest.length > 0 || !guid.success) {
    throw new ImportError("invalid_link");
  }
  const id = guid.data.toLowerCase();
  return { id, url: new URL(`https://chatgpt.com/share/${id}`) };
};

const value: z.ZodType<Value> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(value),
    z.record(z.string(), value),
  ])
);
const cells = z.array(value);

const parseChunk = (literal: string) => {
  try {
    return cells.safeParse(JSON.parse(JSON.parse(literal))).data ?? null;
  } catch {
    return null;
  }
};

const readPayload = (html: string) => {
  let from = 0;
  while (from < html.length) {
    const call = html.indexOf(PAYLOAD, from);
    if (call === -1) {
      return null;
    }
    const open = call + PAYLOAD.length;
    let close = open + 1;
    while (close < html.length && html[close] !== '"') {
      close += html[close] === "\\" ? 2 : 1;
    }
    from = close + 1;
    const found =
      html[open] === '"' && close < html.length
        ? parseChunk(html.slice(open, close + 1))
        : null;
    if (found) {
      return found;
    }
  }
  return null;
};

const tagged = z.tuple([z.string()], value);
const indexes = z.array(z.number());
const keyed = z.record(z.string(), z.number());

const decode = (flat: readonly Value[]): Value => {
  const seen = new Map<number, Value>();
  const at = (index: number): Value => {
    const known = seen.get(index);
    const cell = flat[index];
    if (known !== undefined) {
      return known;
    }
    if (cell === undefined || tagged.safeParse(cell).success) {
      return null;
    }
    const list = indexes.safeParse(cell);
    if (list.success) {
      const items: Value[] = [];
      seen.set(index, items);
      for (const reference of list.data) {
        items.push(at(reference));
      }
      return items;
    }
    const entries = keyed.safeParse(cell);
    if (entries.success) {
      const record: Record<string, Value> = Object.create(null);
      seen.set(index, record);
      for (const [key, reference] of Object.entries(entries.data)) {
        const name = z.string().safeParse(flat[Number(key.slice(1))]);
        if (key.startsWith("_") && name.success) {
          record[name.data] = at(reference);
        }
      }
      return record;
    }
    return cell;
  };
  return at(0);
};

const message = z.object({
  author: z.object({ role: z.string() }),
  content: z.object({
    content_type: z.string(),
    parts: z.array(value).nullish(),
  }),
  id: z.string().nullish(),
  metadata: z
    .object({ is_visually_hidden_from_conversation: z.boolean().nullish() })
    .nullish(),
  recipient: z.string().nullish(),
});

const node = z.object({
  message: message.nullish(),
  parent: z.string().nullish(),
});

const conversation = z.object({
  current_node: z.string().nullish(),
  linear_conversation: z.array(z.object({ id: z.string() })).nullish(),
  mapping: z.record(z.string(), value),
});

const sharePage = z.object({
  loaderData: z.object({
    [ROUTE]: z.object({
      serverResponse: z.union([
        z.object({ type: z.literal("error") }),
        z.object({ data: conversation }),
      ]),
    }),
  }),
});

const nodeOrder = ({
  current_node: current,
  linear_conversation: linear,
  mapping,
}: z.infer<typeof conversation>) => {
  if (linear) {
    return linear.map(({ id }) => id);
  }
  const order: string[] = [];
  let at = current;
  while (at && !order.includes(at)) {
    order.unshift(at);
    at = node.safeParse(mapping[at]).data?.parent;
  }
  return order;
};

const shareConversation = (html: string) => {
  const flat = readPayload(html);
  const page = sharePage.safeParse(flat && decode(flat));
  if (!page.success) {
    throw new ImportError("unreadable");
  }
  const { serverResponse } = page.data.loaderData[ROUTE];
  if (!("data" in serverResponse)) {
    throw new ImportError("unavailable");
  }
  return serverResponse.data;
};

const visibleText = ({ content, metadata }: z.infer<typeof message>) => {
  if (
    metadata?.is_visually_hidden_from_conversation ||
    !TEXT_TYPES.has(content.content_type)
  ) {
    return null;
  }
  const text = (content.parts ?? [])
    .flatMap((part) => {
      const found = z.string().safeParse(part);
      return found.success ? [found.data] : [];
    })
    .join("\n");
  return text.trim() === "" ? null : text;
};

export const parseShare = (html: string) => {
  const data = shareConversation(html);
  const pairs: { id: string; prompt: string; answers: string[] }[] = [];
  let open: (typeof pairs)[number] | undefined;
  for (const nodeId of nodeOrder(data)) {
    const sent = node.safeParse(data.mapping[nodeId]).data?.message;
    const text = sent && visibleText(sent);
    if (sent?.author.role === "user") {
      open = text
        ? { answers: [], id: sent.id ?? nodeId, prompt: text }
        : undefined;
      if (open) {
        pairs.push(open);
      }
    } else if (
      sent?.author.role === "assistant" &&
      open &&
      text &&
      (sent.recipient ?? "all") === "all"
    ) {
      open.answers.push(text);
    }
  }
  const answered = pairs.flatMap(({ id, prompt, answers }) =>
    answers.length > 0 ? [{ answer: answers.join("\n\n"), id, prompt }] : []
  );
  if (answered.length === 0) {
    throw new ImportError("empty");
  }
  if (answered.length > MAX_SHARED_STEPS) {
    throw new ImportError("too_large");
  }
  const steps: SharedStep[] = answered.filter(
    ({ prompt, answer }) =>
      prompt.length <= MAX_TEXT && answer.length <= MAX_TEXT
  );
  return { omitted: answered.length - steps.length, steps };
};

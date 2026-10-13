import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_TEXT } from "@/lib/data/schemas";

import { MAX_SHARED_STEPS, parseShare, parseShareLink } from "./chatgpt";
import type { ImportFailure } from "./errors";
import { ImportError } from "./errors";

const shareId = "6f2a1c3e-9b4d-4e7a-8c15-0d2b3f4a5e60";
const ROUTE = "routes/share.$shareId.($action)";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const flatten = (root: Json) => {
  const values: Json[] = [];
  const add = (item: Json): number => {
    if (item === null) {
      return -5;
    }
    const index = values.length;
    values.push(null);
    if (Array.isArray(item)) {
      values[index] = item.map(add);
    } else if (item instanceof Object) {
      values[index] = Object.fromEntries(
        Object.entries(item).map(([key, entry]) => [`_${add(key)}`, add(entry)])
      );
    } else {
      values[index] = item;
    }
    return index;
  };
  add(root);
  return values;
};

const pageWith = (loaderData: Json) => {
  const payload = JSON.stringify(flatten({ actionData: null, loaderData }));
  return [
    "<!doctype html><html><body><script>window.__reactRouterContext = {};</script>",
    `<script>window.__reactRouterContext.streamController.enqueue(${JSON.stringify(payload)});</script>`,
    `<script>window.__reactRouterContext.streamController.enqueue("P5:[1,2]\\n");</script>`,
    "<script>window.__reactRouterContext.streamController.close();</script></body></html>",
  ].join("");
};

interface Line {
  id: string;
  role: string;
  text?: string;
  type?: string;
  recipient?: string;
  hidden?: boolean;
}

const message = ({
  id,
  role,
  text,
  type = "text",
  recipient,
  hidden,
}: Line): Json => ({
  author: { role },
  content: { content_type: type, parts: text === undefined ? [] : [text] },
  id,
  metadata: hidden ? { is_visually_hidden_from_conversation: true } : {},
  recipient: recipient ?? null,
});

const conversation = (lines: Line[], extra: Record<string, Json> = {}) => {
  const mapping = Object.fromEntries(
    lines.map((line, index) => [
      `node-${line.id}`,
      {
        id: `node-${line.id}`,
        message: message(line),
        parent: index === 0 ? null : `node-${lines[index - 1]?.id}`,
      },
    ])
  );
  return pageWith({
    [ROUTE]: {
      serverResponse: {
        data: {
          linear_conversation: lines.map((line) => ({ id: `node-${line.id}` })),
          mapping,
          title: "A chat",
          ...extra,
        },
      },
      sharedConversationId: shareId,
    },
  });
};

const failure = (run: () => void): ImportFailure | undefined => {
  try {
    run();
  } catch (error) {
    return error instanceof ImportError ? error.reason : undefined;
  }
  return undefined;
};

test("a share link on a ChatGPT host becomes the one canonical URL", () => {
  for (const input of [
    `https://chatgpt.com/share/${shareId}`,
    `  https://chatgpt.com/share/${shareId}/  `,
    `https://chat.openai.com/share/${shareId}`,
    `https://chatgpt.com/share/${shareId.toUpperCase()}?utm=1#top`,
  ]) {
    const link = parseShareLink(input);
    assert.equal(link.id, shareId);
    assert.equal(link.url.href, `https://chatgpt.com/share/${shareId}`);
  }
});

test("links that are not ChatGPT shares are refused before any request", () => {
  const cases: [string, ImportFailure][] = [
    ["hello", "invalid_link"],
    ["", "invalid_link"],
    [`http://chatgpt.com/share/${shareId}`, "unsupported_host"],
    [`https://evil.example/share/${shareId}`, "unsupported_host"],
    [`https://chatgpt.com.evil.example/share/${shareId}`, "unsupported_host"],
    [`https://chatgpt.com@evil.example/share/${shareId}`, "unsupported_host"],
    [`https://user:pass@chatgpt.com/share/${shareId}`, "unsupported_host"],
    [`https://chatgpt.com:8443/share/${shareId}`, "unsupported_host"],
    [`https://127.0.0.1/share/${shareId}`, "unsupported_host"],
    [`https://[::1]/share/${shareId}`, "unsupported_host"],
    [
      `https://evil.example/?u=https://chatgpt.com/share/${shareId}`,
      "unsupported_host",
    ],
    [`file:///etc/passwd`, "unsupported_host"],
    ["https://chatgpt.com/", "invalid_link"],
    [`https://chatgpt.com/c/${shareId}`, "invalid_link"],
    ["https://chatgpt.com/share/not-a-uuid", "invalid_link"],
    [`https://chatgpt.com/share/${shareId}/extra`, "invalid_link"],
  ];
  for (const [input, reason] of cases) {
    assert.equal(
      failure(() => parseShareLink(input)),
      reason,
      input
    );
  }
});

test("a multi-pair chat imports in order with its text untouched", () => {
  const page = conversation([
    { id: "sys", role: "system", text: "You are ChatGPT" },
    { id: "u1", role: "user", text: "  First question?\n" },
    { id: "t1", role: "assistant", text: "thinking", type: "thoughts" },
    { id: "a1", role: "assistant", text: "  First answer.\n\n- one\n- two  " },
    { id: "u2", role: "user", text: "Second question" },
    { id: "a2a", role: "assistant", text: "Let me look that up." },
    { id: "tool", role: "tool", text: "search results" },
    { id: "a2b", role: "assistant", text: "Second answer ✓" },
    { id: "h", role: "user", text: "hidden helper", hidden: true },
    { id: "call", role: "assistant", text: "{}", recipient: "browser" },
    { id: "u3", role: "user", text: "Unanswered" },
    { id: "u4", role: "user", text: "Fourth question" },
    { id: "a4", role: "assistant", text: "Fourth answer" },
  ]);
  const { steps, omitted } = parseShare(page);
  assert.equal(omitted, 0);
  assert.deepEqual(steps, [
    {
      answer: "  First answer.\n\n- one\n- two  ",
      id: "u1",
      prompt: "  First question?\n",
    },
    {
      answer: "Let me look that up.\n\nSecond answer ✓",
      id: "u2",
      prompt: "Second question",
    },
    { answer: "Fourth answer", id: "u4", prompt: "Fourth question" },
  ]);
});

test("the same page always gives the same step ids, so a repeat import can be recognised", () => {
  const page = conversation([
    { id: "u1", role: "user", text: "Q" },
    { id: "a1", role: "assistant", text: "A" },
  ]);
  assert.deepEqual(parseShare(page), parseShare(page));
});

test("without a linear conversation the current branch is followed from the last node", () => {
  const lines: Line[] = [
    { id: "u1", role: "user", text: "Q1" },
    { id: "a1", role: "assistant", text: "A1" },
  ];
  const page = pageWith({
    [ROUTE]: {
      serverResponse: {
        data: {
          current_node: "node-a1",
          mapping: Object.fromEntries(
            lines.map((line, index) => [
              `node-${line.id}`,
              {
                message: message(line),
                parent: index === 0 ? null : "node-u1",
              },
            ])
          ),
        },
      },
    },
  });
  assert.deepEqual(
    parseShare(page).steps.map((step) => step.id),
    ["u1"]
  );
});

test("a pair longer than the step limit is left out and counted", () => {
  const page = conversation([
    { id: "u1", role: "user", text: "Short" },
    { id: "a1", role: "assistant", text: "x".repeat(MAX_TEXT + 1) },
    { id: "u2", role: "user", text: "Fine" },
    { id: "a2", role: "assistant", text: "x".repeat(MAX_TEXT) },
  ]);
  const { steps, omitted } = parseShare(page);
  assert.deepEqual(
    steps.map((step) => step.id),
    ["u2"]
  );
  assert.equal(omitted, 1);
});

test("pages that are not readable chats fail with a clear reason", () => {
  assert.equal(
    failure(() => parseShare("<html>nothing here</html>")),
    "unreadable"
  );
  assert.equal(
    failure(() =>
      parseShare(`<script>x.streamController.enqueue("[not json");</script>`)
    ),
    "unreadable"
  );
  assert.equal(
    failure(() => parseShare(pageWith({ [ROUTE]: {} }))),
    "unreadable"
  );
  assert.equal(
    failure(() =>
      parseShare(
        pageWith({
          [ROUTE]: {
            serverResponse: {
              error: "Conversation has been deleted. Start a new chat.",
              type: "error",
            },
          },
        })
      )
    ),
    "unavailable"
  );
  assert.equal(
    failure(() =>
      parseShare(
        conversation([{ id: "u1", role: "user", text: "Only a prompt" }])
      )
    ),
    "empty"
  );
  assert.equal(
    failure(() =>
      parseShare(
        conversation(
          Array.from({ length: MAX_SHARED_STEPS + 1 }, (_, index) => [
            { id: `u${index}`, role: "user", text: "Q" },
            { id: `a${index}`, role: "assistant", text: "A" },
          ]).flat()
        )
      )
    ),
    "too_large"
  );
});

test("a hostile payload cannot reach Object.prototype", () => {
  const hostile = JSON.parse(
    '{"linear_conversation": [{"id": "__proto__"}], "mapping": {"__proto__": {"message": {"author": {"role": "user"}, "content": {"content_type": "text", "parts": ["x"]}}, "polluted": "yes"}}}'
  );
  const reason = failure(() =>
    parseShare(pageWith({ [ROUTE]: { serverResponse: { data: hostile } } }))
  );
  assert.equal(reason, "empty");
  assert.equal("polluted" in {}, false);
});

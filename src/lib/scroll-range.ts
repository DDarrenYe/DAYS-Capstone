const NAMES = ["contain", "cover", "entry", "exit"] as const;

type RangeName = (typeof NAMES)[number];

export interface Edge {
  name: RangeName;
  percent?: number;
  px?: number;
}

export type Frame =
  | { height: number; top: number; viewport: number }
  | { max: number; position: number };

const isName = (token: string): token is RangeName =>
  NAMES.some((name) => name === token);

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export const splitTop = (value: string, separator: RegExp) => {
  const parts: string[] = [];
  let depth = 0;
  let part = "";
  for (const char of value) {
    depth += Number(char === "(") - Number(char === ")");
    if (depth === 0 && separator.test(char)) {
      parts.push(part);
      part = "";
    } else {
      part += char;
    }
  }
  return [...parts, part].map((item) => item.trim()).filter(Boolean);
};

export const parseRange = (range: string) => {
  const parsed: { name: RangeName; offset?: string }[] = [];
  for (const token of splitTop(range, /\s/u)) {
    const last = parsed.at(-1);
    if (isName(token)) {
      parsed.push({ name: token });
    } else if (last && last.offset === undefined) {
      last.offset = token;
    } else {
      parsed.push({ name: last?.name ?? "cover", offset: token });
    }
  }
  const [start = { name: "cover" as const }, end = { name: start.name }] =
    parsed;
  return [
    { name: start.name, offset: start.offset ?? "0%" },
    { name: end.name, offset: end.offset ?? "100%" },
  ] as const;
};

export const rangeProgress = (start: Edge, end: Edge, frame: Frame) => {
  let at: (edge: Edge) => number;
  let position: number;
  if ("top" in frame) {
    const { height, top, viewport } = frame;
    const inner = Math.min(height, viewport);
    const outer = Math.max(height, viewport);
    const spans = {
      contain: [inner, outer],
      cover: [0, viewport + height],
      entry: [0, inner],
      exit: [outer, viewport + height],
    } satisfies Record<RangeName, [number, number]>;
    at = ({ name, percent, px }) => {
      const [from, to] = spans[name];
      return (
        from +
        (percent === undefined ? (px ?? 0) : (percent / 100) * (to - from))
      );
    };
    position = viewport - top;
  } else {
    at = ({ percent, px }) =>
      percent === undefined ? (px ?? 0) : (percent / 100) * frame.max;
    ({ position } = frame);
  }
  const from = at(start);
  const to = at(end);
  return to === from
    ? Number(position >= to)
    : clamp((position - from) / (to - from));
};

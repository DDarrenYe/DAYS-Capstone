import type { z } from "zod";

/* Parses a stored value against its schema; anything missing, malformed or the wrong shape gives the fallback. */
export const parseStored = <T>(
  raw: string | null,
  schema: z.ZodType<T>,
  fallback: T
): T => {
  if (raw === null) {
    return fallback;
  }
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
};

/* A copy of record with key set to value, or removed when value is undefined. */
export const withEntry = <T>(
  record: Readonly<Record<string, T>>,
  key: string,
  value?: T
): Record<string, T> => {
  const rest = Object.fromEntries(
    Object.entries(record).filter(([entry]) => entry !== key)
  );
  return value === undefined ? rest : { ...rest, [key]: value };
};

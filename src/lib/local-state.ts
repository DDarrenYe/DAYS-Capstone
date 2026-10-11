"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { z } from "zod";

import { parseStored } from "@/lib/stored";

/*
  State that outlives a reload: student drafts and, until the review tables exist, grader decisions on example
  data. Values are validated on read because anything in localStorage can be edited by hand. Every key sits
  under one prefix so sign-out can wipe them all, and other tabs see changes through the storage event.
*/
const PREFIX = "margin:";
const listeners = new Set<() => void>();

const read = (key: string) => {
  try {
    return globalThis.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
};

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  globalThis.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener("storage", listener);
  };
};

/* fallback must be stable (a module constant): it is the value before anything is stored, and on the server. */
export const usePersistentState = <T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T
) => {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );
  const value = useMemo(
    () => parseStored(raw, schema, fallback),
    [raw, schema, fallback]
  );
  const setValue = useCallback(
    (update: (current: T) => T) => {
      const resolved = update(parseStored(read(key), schema, fallback));
      try {
        globalThis.localStorage.setItem(PREFIX + key, JSON.stringify(resolved));
      } catch {
        return;
      }
      notify();
    },
    [key, schema, fallback]
  );
  return [value, setValue] as const;
};

/* Removes every Margin key, so the next person on a shared computer starts clean. */
export const clearLocalState = () => {
  try {
    const storage = globalThis.localStorage;
    for (const key of Object.keys(storage)) {
      if (key.startsWith(PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch {
    return;
  }
  notify();
};

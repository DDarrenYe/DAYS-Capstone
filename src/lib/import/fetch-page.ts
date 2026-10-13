import "server-only";
import { lookup as resolve } from "node:dns";
import { once } from "node:events";
import type http from "node:http";
import type { IncomingMessage } from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";
import type { LookupFunction } from "node:net";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

import { ImportError } from "@/lib/import/errors";

export interface Tuning {
  lookup: LookupFunction;
  maxBytes: number;
  maxRedirects: number;
  timeoutMs: number;
  transport: Pick<typeof http, "request">;
}

const reserved = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  reserved.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 96],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  reserved.addSubnet(network, prefix, "ipv6");
}

export const isPublicAddress = (address: string) => {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  try {
    return !reserved.check(address, family === 6 ? "ipv6" : "ipv4");
  } catch {
    return false;
  }
};

/* oxlint-disable promise/prefer-await-to-callbacks -- node:https accepts only a callback-style lookup hook */
const publicOnly: LookupFunction = (hostname, options, report) => {
  resolve(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      report(error, "", 0);
      return;
    }
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => !isPublicAddress(address))
    ) {
      report(new ImportError("blocked"), "", 0);
      return;
    }
    if (options.all) {
      report(null, addresses);
      return;
    }
    report(null, addresses[0].address, addresses[0].family);
  });
};
/* oxlint-enable promise/prefer-await-to-callbacks */

const DEFAULTS: Tuning = {
  lookup: publicOnly,
  maxBytes: 5 * 1024 * 1024,
  maxRedirects: 3,
  timeoutMs: 10_000,
  transport: https,
};

const HEADERS = {
  accept: "text/html",
  "accept-encoding": "gzip, br",
  "user-agent": "Mozilla/5.0 (compatible; MarginLogImport/1.0)",
};

const decoderFor = (encoding: string | undefined) => {
  switch (encoding?.trim().toLowerCase()) {
    case undefined:
    case "":
    case "identity": {
      return null;
    }
    case "gzip": {
      return createGunzip();
    }
    case "br": {
      return createBrotliDecompress();
    }
    case "deflate": {
      return createInflate();
    }
    default: {
      throw new ImportError("unreadable");
    }
  }
};

const expire = async (signal: AbortSignal): Promise<never> => {
  if (!signal.aborted) {
    await once(signal, "abort");
  }
  throw new ImportError("timeout");
};

const get = async (url: URL, tuning: Tuning, signal: AbortSignal) => {
  const request = tuning.transport.request(url, {
    headers: HEADERS,
    lookup: tuning.lookup,
    method: "GET",
  });
  request.end();
  try {
    const [response]: IncomingMessage[] = await Promise.race([
      once(request, "response"),
      expire(signal),
    ]);
    if (!response) {
      throw new ImportError("unavailable");
    }
    return response;
  } catch (error) {
    request.destroy();
    throw error;
  }
};

const readBody = async (
  response: IncomingMessage,
  { maxBytes }: Tuning,
  signal: AbortSignal
) => {
  if (Number(response.headers["content-length"]) > maxBytes) {
    throw new ImportError("too_large");
  }
  const decoder = decoderFor(response.headers["content-encoding"]);
  const chunks: Buffer[] = [];
  let size = 0;
  const sink = new Writable({
    write(chunk: Buffer, _encoding, accept) {
      size += chunk.length;
      if (size > maxBytes) {
        accept(new ImportError("too_large"));
        return;
      }
      chunks.push(chunk);
      accept();
    },
  });
  try {
    await Promise.race([
      pipeline(decoder ? [response, decoder, sink] : [response, sink]),
      expire(signal),
    ]);
  } catch (error) {
    response.destroy();
    throw error;
  }
  return Buffer.concat(chunks).toString("utf-8");
};

const follow = async (
  url: URL,
  accept: (next: URL) => URL,
  tuning: Tuning,
  signal: AbortSignal,
  redirects: number
): Promise<string> => {
  const response = await get(url, tuning, signal);
  const status = response.statusCode ?? 0;
  const { location } = response.headers;
  if (status >= 300 && status < 400 && location) {
    response.resume();
    if (redirects === 0 || !URL.canParse(location, url)) {
      throw new ImportError("blocked");
    }
    return follow(
      accept(new URL(location, url)),
      accept,
      tuning,
      signal,
      redirects - 1
    );
  }
  if (status !== 200) {
    response.resume();
    throw new ImportError(
      [401, 403, 429].includes(status) ? "blocked" : "unavailable"
    );
  }
  if (!/^text\/html\b/iu.test(response.headers["content-type"] ?? "")) {
    response.resume();
    throw new ImportError("unreadable");
  }
  return readBody(response, tuning, signal);
};

export const fetchPage = async (
  start: URL,
  accept: (url: URL) => URL,
  overrides: Partial<Tuning> = {}
) => {
  const tuning = { ...DEFAULTS, ...overrides };
  const first = accept(start);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), tuning.timeoutMs);
  try {
    return await follow(
      first,
      accept,
      tuning,
      controller.signal,
      tuning.maxRedirects
    );
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    throw new ImportError(
      controller.signal.aborted ? "timeout" : "unavailable",
      error
    );
  } finally {
    clearTimeout(timer);
  }
};

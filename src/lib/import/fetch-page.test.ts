import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import { after, before, test } from "node:test";
import { gzipSync } from "node:zlib";

import { z } from "zod";

import { ImportError } from "./errors";
import type { ImportFailure } from "./errors";
import { fetchPage, isPublicAddress } from "./fetch-page";
import type { Tuning } from "./fetch-page";

type Handler = (response: http.ServerResponse) => void;

const html = (
  response: http.ServerResponse,
  headers: http.OutgoingHttpHeaders = {}
) => response.writeHead(200, { "content-type": "text/html", ...headers });

const handlers = new Map<string, Handler>([
  [
    "/big",
    (response) => {
      html(response).write("a".repeat(600));
      response.write("b".repeat(600));
      response.end();
    },
  ],
  [
    "/bomb",
    (response) => {
      html(response, { "content-encoding": "gzip" }).end(
        gzipSync("z".repeat(100_000))
      );
    },
  ],
  [
    "/forbidden",
    (response) => {
      response.writeHead(403).end();
    },
  ],
  [
    "/gzip",
    (response) => {
      html(response, { "content-encoding": "gzip" }).end(
        gzipSync("<p>zipped é</p>")
      );
    },
  ],
  [
    "/json",
    (response) => {
      response.writeHead(200, { "content-type": "application/json" }).end("{}");
    },
  ],
  [
    "/length",
    (response) => {
      html(response, { "content-length": "5000" }).end("short");
    },
  ],
  [
    "/loop",
    (response) => {
      response.writeHead(302, { location: "/loop" }).end();
    },
  ],
  [
    "/missing",
    (response) => {
      response.writeHead(404).end();
    },
  ],
  [
    "/ok",
    (response) => {
      html(response).end("<p>hello é</p>");
    },
  ],
  [
    "/odd-encoding",
    (response) => {
      html(response, { "content-encoding": "compress" }).end("x");
    },
  ],
  [
    "/redirect",
    (response) => {
      response.writeHead(302, { location: "/ok" }).end();
    },
  ],
  ["/slow", () => {}],
  [
    "/stall",
    (response) => {
      html(response).write("<p>started");
    },
  ],
  [
    "/away",
    (response) => {
      response
        .writeHead(302, { location: "http://169.254.169.254/latest" })
        .end();
    },
  ],
]);

const server = http.createServer((request, response) => {
  const handle = handlers.get(request.url ?? "") ?? handlers.get("/missing");
  handle?.(response);
});
let origin = "";

before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = z.object({ port: z.number() }).parse(server.address());
  origin = `http://127.0.0.1:${port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

const direct: Partial<Tuning> = {
  lookup: (_host, options, answer) => {
    if (options.all) {
      answer(null, [{ address: "127.0.0.1", family: 4 }]);
      return;
    }
    answer(null, "127.0.0.1", 4);
  },
  transport: http,
};

const anyUrl = (url: URL) => url;

const failure = async (run: () => Promise<string>) => {
  try {
    await run();
    return null;
  } catch (error) {
    return error instanceof ImportError ? error.reason : String(error);
  }
};

const fetchFrom = (
  path: string,
  overrides: Partial<Tuning> = {},
  accept = anyUrl
) => fetchPage(new URL(path, origin), accept, { ...direct, ...overrides });

test("a normal HTML page is read as UTF-8", async () => {
  assert.equal(await fetchFrom("/ok"), "<p>hello é</p>");
});

test("compressed pages are decoded", async () => {
  assert.equal(await fetchFrom("/gzip"), "<p>zipped é</p>");
});

test("every redirect hop goes through the policy before it is followed", async () => {
  const seen: string[] = [];
  const page = await fetchFrom("/redirect", {}, (url) => {
    seen.push(url.pathname);
    return url;
  });
  assert.equal(page, "<p>hello é</p>");
  assert.deepEqual(seen, ["/redirect", "/ok"]);
});

test("a redirect the policy refuses is never requested", async () => {
  const offered: string[] = [];
  const reason = await failure(() =>
    fetchFrom("/away", {}, (url) => {
      offered.push(url.href);
      if (url.hostname !== "127.0.0.1") {
        throw new ImportError("blocked");
      }
      return url;
    })
  );
  assert.equal(reason, "blocked");
  assert.deepEqual(offered, [
    `${origin}/away`,
    "http://169.254.169.254/latest",
  ]);
});

test("redirect loops stop after the hop limit", async () => {
  assert.equal(await failure(() => fetchFrom("/loop")), "blocked");
});

test("status codes map to a reason a student can act on", async () => {
  const cases: [string, ImportFailure][] = [
    ["/missing", "unavailable"],
    ["/forbidden", "blocked"],
    ["/json", "unreadable"],
    ["/odd-encoding", "unreadable"],
  ];
  const reasons = await Promise.all(
    cases.map(([path]) => failure(() => fetchFrom(path)))
  );
  assert.deepEqual(
    reasons,
    cases.map(([, reason]) => reason)
  );
});

test("pages over the size limit are refused, declared or streamed", async () => {
  assert.equal(
    await failure(() => fetchFrom("/length", { maxBytes: 1000 })),
    "too_large"
  );
  assert.equal(
    await failure(() => fetchFrom("/big", { maxBytes: 1000 })),
    "too_large"
  );
  assert.equal(
    await failure(() => fetchFrom("/big", { maxBytes: 1200 })),
    null
  );
});

test("a small download that expands past the limit is refused", async () => {
  assert.equal(
    await failure(() => fetchFrom("/bomb", { maxBytes: 10_000 })),
    "too_large"
  );
});

test("a server that never answers is cut off at the deadline", async () => {
  const started = Date.now();
  assert.equal(
    await failure(() => fetchFrom("/slow", { timeoutMs: 150 })),
    "timeout"
  );
  assert.ok(Date.now() - started < 3000);
});

test("a server that stops partway through the body is cut off at the same deadline", async () => {
  const started = Date.now();
  assert.equal(
    await failure(() => fetchFrom("/stall", { timeoutMs: 150 })),
    "timeout"
  );
  assert.ok(Date.now() - started < 3000);
});

test("a connection that fails is reported as unavailable", async () => {
  const closed = http.createServer();
  closed.listen(0, "127.0.0.1");
  await once(closed, "listening");
  const { port } = z.object({ port: z.number() }).parse(closed.address());
  closed.close();
  await once(closed, "close");
  const reason = await failure(() =>
    fetchPage(new URL(`http://127.0.0.1:${port}/`), anyUrl, direct)
  );
  assert.equal(reason, "unavailable");
});

test("the default resolver refuses a name that points at a private address", async () => {
  const reason = await failure(() =>
    fetchPage(
      new URL(`${origin.replace("127.0.0.1", "localhost")}/ok`),
      anyUrl,
      { transport: http }
    )
  );
  assert.equal(reason, "blocked");
});

test("only routable public addresses pass the network check", () => {
  const allowed = [
    "8.8.8.8",
    "104.18.32.47",
    "172.32.0.1",
    "2606:4700:4408::ac40:9bd1",
    "::ffff:8.8.8.8",
  ];
  const refused = [
    "0.0.0.0",
    "10.0.0.5",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::7f00:1",
    "2002:7f00:1::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "localhost",
    "not-an-ip",
    "",
  ];
  assert.deepEqual(
    allowed.filter((address) => !isPublicAddress(address)),
    []
  );
  assert.deepEqual(refused.filter(isPublicAddress), []);
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { NextRequest } from "next/server";

import { proxy } from "./proxy";

const user = {
  id: "10000000-0000-0000-0000-000000000001",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-10-10T00:00:00Z",
};

const sessionCookie = (expired = false) => {
  const session = {
    access_token: "access",
    refresh_token: "refresh",
    expires_at: expired ? 1 : Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
  return `sb-project-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
};

const request = (path: string, cookie = "", prefetch = false) => {
  const headers = new Headers({ cookie });
  if (prefetch) {
    headers.set("RSC", "1");
    headers.set("Next-Router-Prefetch", "1");
  }
  return new NextRequest(`https://app.example${path}`, { headers });
};

test("proxy only reads the session cookie and redirects signed-out visitors", async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const calls: string[] = [];
  let refresh: "renewed" | "revoked" = "renewed";
  globalThis.fetch = (input, init) => {
    const { pathname } = new URL(new Request(input, init).url);
    calls.push(pathname);
    assert.equal(pathname, "/auth/v1/token");
    if (refresh === "revoked") {
      return Promise.resolve(
        Response.json(
          {
            error: "invalid_grant",
            error_description: "Invalid Refresh Token",
          },
          { status: 400, headers: { "X-Supabase-Api-Version": "2024-01-01" } }
        )
      );
    }
    return Promise.resolve(
      Response.json({
        access_token: "access-renewed",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      })
    );
  };
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anonymous-key";

    const anonymous = await proxy(
      request("/student/log?next=https://evil.example")
    );
    assert.equal(anonymous.status, 307);
    assert.equal(anonymous.headers.get("location"), "https://app.example/");
    assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
    const publicPages = await Promise.all([
      proxy(request("/")),
      proxy(request("/privacy")),
      proxy(request("/students")),
    ]);
    for (const response of publicPages) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), null);
    }

    const signedIn = await Promise.all([
      proxy(request("/", sessionCookie())),
      proxy(request("/student/log", sessionCookie())),
      proxy(request("/instructor/flags", sessionCookie(), true)),
    ]);
    for (const response of signedIn) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
    assert.deepEqual(calls, []);

    const refreshed = await proxy(request("/student/log", sessionCookie(true)));
    assert.equal(refreshed.status, 200);
    const refreshedCookie = refreshed.cookies.get("sb-project-auth-token");
    assert.ok(refreshedCookie);
    assert.match(
      refreshed.headers.get("x-middleware-request-cookie") ?? "",
      /sb-project-auth-token=base64-/u
    );
    assert.equal(refreshed.headers.get("expires"), "0");
    assert.equal(refreshed.headers.get("pragma"), "no-cache");
    const refreshedSession = JSON.parse(
      Buffer.from(refreshedCookie.value.slice(7), "base64url").toString()
    );
    assert.equal(refreshedSession.access_token, "access-renewed");
    assert.deepEqual(calls, ["/auth/v1/token"]);

    refresh = "revoked";
    console.error = () => {};
    const revoked = await proxy(request("/instructor", sessionCookie(true)));
    assert.equal(revoked.status, 307);
    assert.equal(revoked.headers.get("location"), "https://app.example/");
    assert.equal(revoked.cookies.get("sb-project-auth-token")?.maxAge, 0);
    assert.equal(revoked.headers.get("expires"), "0");
    assert.equal(revoked.headers.get("pragma"), "no-cache");
    assert.equal(revoked.headers.get("cache-control"), "private, no-store");
    const revokedHome = await proxy(request("/", sessionCookie(true)));
    assert.equal(revokedHome.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  }
});

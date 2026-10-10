import assert from "node:assert/strict";
import { test } from "node:test";

import { NextRequest } from "next/server";

import { proxy } from "./proxy";

const userId = "10000000-0000-0000-0000-000000000001";
const user = {
  id: userId,
  app_metadata: {},
  user_metadata: { role: "instructor" },
  aud: "authenticated",
  created_at: "2026-10-10T00:00:00Z",
};

const sessionCookie = (role: string, expired = false) => {
  const session = {
    access_token: `${role}-access`,
    refresh_token: `${role}-refresh`,
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

test("proxy verifies identity and preserves refreshed cookies and cache headers across role redirects", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let profileRole = "student";
  let revoked = false;
  let unavailable = false;
  globalThis.fetch = async (input, init) => {
    const incoming = new Request(input, init);
    const url = new URL(incoming.url);
    if (url.pathname === "/auth/v1/token") {
      const { refresh_token: refreshToken } = await incoming.json();
      return Response.json({
        access_token: `${refreshToken}-renewed`,
        refresh_token: refreshToken,
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    }
    if (url.pathname === "/auth/v1/user") {
      assert.ok(incoming.headers.get("authorization")?.startsWith("Bearer "));
      if (unavailable) {
        return Response.json(
          { message: "Unavailable", code: "unexpected_failure" },
          { status: 500 }
        );
      }
      return revoked
        ? Response.json(
            { message: "Session not found", code: "session_not_found" },
            { status: 400, headers: { "X-Supabase-Api-Version": "2024-01-01" } }
          )
        : Response.json(user);
    }
    assert.equal(url.pathname, "/rest/v1/profiles");
    assert.equal(url.searchParams.get("id"), `eq.${userId}`);
    return Response.json({ display_name: "Demo Account", role: profileRole });
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
    const anonymousHome = await proxy(request("/"));
    assert.equal(anonymousHome.status, 200);

    const student = await proxy(
      request("/student/log", sessionCookie("student"))
    );
    assert.equal(student.status, 200);
    assert.equal(student.headers.get("location"), null);
    assert.equal(student.headers.get("cache-control"), "private, no-store");
    const crossRole = await proxy(
      request(
        "/instructor/flags?next=https://evil.example",
        sessionCookie("student"),
        true
      )
    );
    assert.equal(crossRole.status, 307);
    assert.equal(
      crossRole.headers.get("location"),
      "https://app.example/student"
    );
    assert.equal(crossRole.headers.get("cache-control"), "private, no-store");

    const refreshed = await proxy(
      request("/student/log", sessionCookie("student", true))
    );
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
    assert.equal(refreshedSession.access_token, "student-refresh-renewed");

    const refreshedRedirect = await proxy(
      request("/instructor", sessionCookie("student", true))
    );
    assert.equal(refreshedRedirect.status, 307);
    assert.ok(refreshedRedirect.cookies.get("sb-project-auth-token"));
    assert.equal(refreshedRedirect.headers.get("expires"), "0");
    assert.equal(refreshedRedirect.headers.get("pragma"), "no-cache");
    assert.equal(
      refreshedRedirect.headers.get("cache-control"),
      "private, no-store"
    );

    profileRole = "instructor";
    const instructor = await proxy(
      request("/student/progress", sessionCookie("instructor"))
    );
    assert.equal(
      instructor.headers.get("location"),
      "https://app.example/instructor"
    );
    const instructorHome = await proxy(
      request("/instructor/reports", sessionCookie("instructor"))
    );
    assert.equal(instructorHome.status, 200);
    const signedInHome = await proxy(request("/", sessionCookie("instructor")));
    assert.equal(
      signedInHome.headers.get("location"),
      "https://app.example/instructor"
    );

    revoked = true;
    const invalid = await proxy(
      request("/instructor", sessionCookie("instructor"))
    );
    assert.equal(invalid.headers.get("location"), "https://app.example/");
    assert.equal(invalid.cookies.get("sb-project-auth-token")?.maxAge, 0);
    revoked = false;
    unavailable = true;
    await assert.rejects(
      proxy(request("/student", sessionCookie("student"))),
      /Unable to verify your session/u
    );
    unavailable = false;
    profileRole = "admin";
    await assert.rejects(
      proxy(request("/student", sessionCookie("student"))),
      /Unable to load your account/u
    );
    const brokenHome = await proxy(request("/", sessionCookie("student")));
    assert.equal(brokenHome.status, 200);
    assert.equal(brokenHome.headers.get("location"), null);
  } finally {
    globalThis.fetch = originalFetch;
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

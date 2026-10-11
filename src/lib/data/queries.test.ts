import assert from "node:assert/strict";
import { test } from "node:test";

import { createClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";

import {
  assignmentsQuery,
  invalidateAfterOpen,
  invalidateAfterReview,
  invalidateAfterSave,
  invalidateAfterSubmit,
  projectLogQuery,
  queryKeys,
  reviewsQuery,
  submissionsQuery,
} from "./queries";

const userId = "10000000-0000-0000-0000-000000000001";
const otherUserId = "10000000-0000-0000-0000-000000000002";
const projectId = "20000000-0000-0000-0000-000000000001";
const otherProjectId = "20000000-0000-0000-0000-000000000002";

const claimsFor = (sub: string) => ({
  claims: {
    aal: "aal1",
    aud: "authenticated",
    exp: 0,
    iat: 0,
    iss: "https://project.supabase.co/auth/v1",
    role: "authenticated",
    session_id: "session",
    sub,
  },
  header: { alg: "ES256", kid: "key", typ: "JWT" },
  signature: new Uint8Array(),
});

const clientFor = (
  sub: string | undefined,
  respond: (url: URL) => Response = () => {
    throw new Error("Unexpected database read");
  }
) => {
  const client = createClient("https://project.supabase.co", "anonymous-key", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input) => Promise.resolve(respond(new URL(String(input)))),
    },
  });
  client.auth.getClaims = () =>
    Promise.resolve(
      sub ? { data: claimsFor(sub), error: null } : { data: null, error: null }
    );
  return client;
};

const seededCache = () => {
  const queryClient = new QueryClient();
  for (const owner of [userId, otherUserId]) {
    for (const queryKey of [
      queryKeys.assignments(owner),
      queryKeys.submissions(owner),
      queryKeys.projectLog(owner, projectId),
      queryKeys.reviews(owner, projectId),
      queryKeys.projectLog(owner, otherProjectId),
    ]) {
      queryClient.setQueryData(queryKey, []);
    }
  }
  return queryClient;
};

const invalidated = (queryClient: QueryClient) =>
  queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.isInvalidated)
    .map((query) => query.queryKey.join("/"))
    .toSorted();

const keysOf = (owner: string, ...names: string[]) =>
  names.map((name) => `users/${owner}/${name}`).toSorted();

test("query keys never share a prefix between users or projects", () => {
  const keys = [
    queryKeys.assignments(userId),
    queryKeys.submissions(userId),
    queryKeys.projectLog(userId, projectId),
    queryKeys.reviews(userId, projectId),
  ];
  for (const key of keys) {
    assert.deepEqual(key.slice(0, 2), ["users", userId]);
  }
  assert.deepEqual(
    queryKeys.projectLog(userId, projectId).slice(0, 4),
    queryKeys.project(userId, projectId)
  );
  assert.notDeepEqual(
    queryKeys.projectLog(userId, projectId),
    queryKeys.projectLog(otherUserId, projectId)
  );
  assert.notDeepEqual(
    queryKeys.projectLog(userId, projectId),
    queryKeys.projectLog(userId, otherProjectId)
  );
});

test("opening an assignment invalidates only that user's assignment list", async () => {
  const queryClient = seededCache();
  await invalidateAfterOpen(queryClient, userId);
  assert.deepEqual(invalidated(queryClient), keysOf(userId, "assignments"));
});

test("saving a step invalidates that project and the assignment list for the same user only", async () => {
  const queryClient = seededCache();
  await invalidateAfterSave(queryClient, userId, projectId);
  assert.deepEqual(
    invalidated(queryClient),
    keysOf(
      userId,
      "assignments",
      `projects/${projectId}/log`,
      `projects/${projectId}/reviews`
    )
  );
});

test("submitting also invalidates submissions", async () => {
  const queryClient = seededCache();
  await invalidateAfterSubmit(queryClient, userId, projectId);
  assert.deepEqual(
    invalidated(queryClient),
    keysOf(
      userId,
      "assignments",
      "submissions",
      `projects/${projectId}/log`,
      `projects/${projectId}/reviews`
    )
  );
});

test("reviewing invalidates the project and submissions but not assignments", async () => {
  const queryClient = seededCache();
  await invalidateAfterReview(queryClient, userId, projectId);
  assert.deepEqual(
    invalidated(queryClient),
    keysOf(
      userId,
      "submissions",
      `projects/${projectId}/log`,
      `projects/${projectId}/reviews`
    )
  );
});

test("reads stop before the database when the session belongs to someone else", async () => {
  type TestClient = ReturnType<typeof clientFor>;
  const attempts = [
    (queryClient: QueryClient, client: TestClient) =>
      queryClient.query(assignmentsQuery(client, userId)),
    (queryClient: QueryClient, client: TestClient) =>
      queryClient.query(submissionsQuery(client, userId)),
    (queryClient: QueryClient, client: TestClient) =>
      queryClient.query(projectLogQuery(client, userId, projectId)),
    (queryClient: QueryClient, client: TestClient) =>
      queryClient.query(reviewsQuery(client, userId, projectId)),
  ];
  await Promise.all(
    [otherUserId, undefined].flatMap((sub) =>
      attempts.map(async (attempt) => {
        const queryClient = new QueryClient();
        await assert.rejects(
          attempt(queryClient, clientFor(sub)),
          /session changed/u
        );
        const [cached] = queryClient.getQueryCache().getAll();
        assert.equal(cached?.state.data, undefined);
      })
    )
  );
});

test("assignments are read through the signed-in user's session", async () => {
  const requests: URL[] = [];
  const queryClient = new QueryClient();
  const rows = [{ id: "a", title: "Essay" }];
  const data = await queryClient.query(
    assignmentsQuery(
      clientFor(userId, (url) => {
        requests.push(url);
        return Response.json(rows);
      }),
      userId
    )
  );
  assert.deepEqual(data, rows);
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.pathname, "/rest/v1/assignments");
  assert.deepEqual(
    queryClient.getQueryData(queryKeys.assignments(userId)),
    rows
  );
  assert.equal(
    queryClient.getQueryData(queryKeys.assignments(otherUserId)),
    undefined
  );
});

test("database failures and missing projects become safe load errors", async () => {
  await assert.rejects(
    new QueryClient().query(
      assignmentsQuery(
        clientFor(userId, () =>
          Response.json(
            { code: "XX000", message: "secret detail" },
            { status: 500 }
          )
        ),
        userId
      )
    ),
    (error: Error) =>
      error.message === "Unable to load assignments." &&
      !error.message.includes("secret")
  );
  await assert.rejects(
    new QueryClient().query(
      projectLogQuery(
        clientFor(userId, () => Response.json([])),
        userId,
        projectId
      )
    ),
    /Unable to load the project log\./u
  );
});

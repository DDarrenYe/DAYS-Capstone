import assert from "node:assert/strict";
import { test } from "node:test";

import { AuthApiError, createClient } from "@supabase/supabase-js";

import { readAccount } from "./account";

const user = {
  id: "10000000-0000-0000-0000-000000000001",
  app_metadata: {},
  user_metadata: { role: "instructor" },
  aud: "authenticated",
  created_at: "2026-10-10T00:00:00Z",
};

for (const role of ["student", "instructor"]) {
  test(`account reads the ${role} profile using the verified user ID, not metadata`, async () => {
    const client = createClient(
      "https://project.supabase.co",
      "anonymous-key",
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input) => {
            const url = new URL(String(input));
            assert.equal(url.pathname, "/rest/v1/profiles");
            assert.equal(url.searchParams.get("id"), `eq.${user.id}`);
            assert.equal(url.searchParams.get("select"), "display_name,role");
            return Promise.resolve(
              Response.json({ display_name: "Demo Account", role })
            );
          },
        },
      }
    );
    client.auth.getUser = () =>
      Promise.resolve({ data: { user }, error: null });
    assert.deepEqual(await readAccount(client), {
      id: user.id,
      displayName: "Demo Account",
      role,
    });
  });
}

test("signed-out users do not read profiles", async () => {
  const client = createClient("https://project.supabase.co", "anonymous-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: () => {
        throw new Error("Unexpected profile read");
      },
    },
  });
  assert.equal(await readAccount(client), null);
});

test("session service failures do not become signed-out redirects", async () => {
  const client = createClient("https://project.supabase.co", "anonymous-key");
  client.auth.getUser = () =>
    Promise.resolve({
      data: { user: null },
      error: new AuthApiError("Unavailable", 503, "unexpected_failure"),
    });
  await assert.rejects(readAccount(client), /Unable to verify your session/u);
});

test("missing and invalid profiles fail closed", async () => {
  await Promise.all(
    [null, { display_name: "Unknown", role: "admin" }].map(async (profile) => {
      const client = createClient(
        "https://project.supabase.co",
        "anonymous-key",
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: () => Promise.resolve(Response.json(profile)) },
        }
      );
      client.auth.getUser = () =>
        Promise.resolve({ data: { user }, error: null });
      await assert.rejects(readAccount(client), /Unable to load your account/u);
    })
  );
});

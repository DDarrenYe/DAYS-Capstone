import assert from "node:assert/strict";
import { test } from "node:test";

import { parseCredentials } from "./credentials";

const invalidCredentials = [
  { email: "invalid", password: "password" },
  { email: "student@example.com", password: "" },
  { email: "student@example.com", password: "x".repeat(1025) },
];

test("invalid credentials are rejected before contacting Auth", () => {
  for (const credentials of invalidCredentials) {
    const formData = new FormData();
    formData.set("email", credentials.email);
    formData.set("password", credentials.password);
    assert.equal(parseCredentials(formData), null);
  }
  const formData = new FormData();
  formData.set("email", new File(["student@example.com"], "email.txt"));
  formData.set("password", "password");
  assert.equal(parseCredentials(formData), null);
});

test("email is normalized without trimming the password", () => {
  const formData = new FormData();
  formData.set("email", "  Student@Example.COM  ");
  formData.set("password", "  my password  ");
  assert.deepEqual(parseCredentials(formData), {
    email: "student@example.com",
    password: "  my password  ",
  });
});

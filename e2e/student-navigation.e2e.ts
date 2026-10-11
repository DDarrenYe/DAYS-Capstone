import { randomUUID } from "node:crypto";

import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import type { Database } from "../src/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!(url && serviceRoleKey)) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the local stack (see the README)."
  );
}

const admin = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const tag = randomUUID().slice(0, 8);
const password = `E2e-${tag}-Pass1!`;
const email = `${tag}-student@example.test`;
const essay = `${tag} Essay`;
const lab = `${tag} Lab`;

interface CreatedRows {
  assignments: string[];
  courseId: string;
  instructorId: string;
  projectId: string;
  studentId: string;
}

const created: CreatedRows = {
  assignments: [],
  courseId: "",
  instructorId: "",
  projectId: "",
  studentId: "",
};

const must = async <T>(pending: PromiseLike<PostgrestSingleResponse<T>>) => {
  const { data, error } = await pending;
  if (error || data === null) {
    throw error ?? new Error("Fixture query returned no rows.");
  }
  return data;
};

const createUser = async (name: string) => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `${tag}-${name}@example.test`,
    email_confirm: true,
    password,
    user_metadata: { display_name: name },
  });
  if (error) {
    throw error;
  }
  return data.user.id;
};

test.beforeAll(async () => {
  created.studentId = await createUser("student");
  created.instructorId = await createUser("instructor");
  await admin
    .from("profiles")
    .update({ role: "instructor" })
    .eq("id", created.instructorId);
  const course = await must(
    admin
      .from("courses")
      .insert({
        code: `E2E-${tag}`,
        instructor_id: created.instructorId,
        title: "E2E course",
      })
      .select("id")
      .single()
  );
  created.courseId = course.id;
  await admin
    .from("enrolments")
    .insert({ course_id: course.id, email, student_id: created.studentId });
  const assignments = await must(
    admin
      .from("assignments")
      .insert([
        { course_id: course.id, lane: "lane_2", title: essay },
        { course_id: course.id, lane: "lane_1", title: lab },
      ])
      .select("id, title")
  );
  created.assignments = assignments.map(({ id }) => id);
  const project = await must(
    admin
      .from("projects")
      .insert({
        assignment_id:
          assignments.find(({ title }) => title === essay)?.id ?? "",
        course_id: course.id,
        student_id: created.studentId,
      })
      .select("id")
      .single()
  );
  created.projectId = project.id;
  await admin.from("iterations").insert(
    [1, 2].map((step) => ({
      ai_tool: "Tool",
      project_id: project.id,
      prompt: `Prompt ${step}`,
      raw_answer: "Answer",
      step_number: step,
    }))
  );
});

test.afterAll(async () => {
  await admin.from("projects").delete().eq("id", created.projectId);
  await admin.from("enrolments").delete().eq("course_id", created.courseId);
  await admin.from("assignments").delete().in("id", created.assignments);
  await admin.from("courses").delete().eq("id", created.courseId);
  await admin
    .from("profiles")
    .delete()
    .in("id", [created.studentId, created.instructorId]);
  await admin.auth.admin.deleteUser(created.studentId);
  await admin.auth.admin.deleteUser(created.instructorId);
});

const letReleasedNavigationSettle = (page: Page) => page.waitForTimeout(1000);

const signIn = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/student");
  await expect(page.getByRole("heading", { name: essay })).toBeVisible();
};

test("a page load shows the static shell, then the assignments stream in", async ({
  baseURL,
  page,
}) => {
  await signIn(page);
  await instant(
    page,
    async () => {
      await page.goto("/student");
      await expect(
        page.getByRole("heading", { name: "Assignments", level: 1 })
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: essay })).toHaveCount(0);
    },
    { baseURL }
  );
  await expect(page.getByRole("heading", { name: essay })).toBeVisible();
});

test("navigating to the assignments shows them straight away", async ({
  page,
}) => {
  await signIn(page);
  await page.getByRole("link", { name: "My log" }).click();
  await page.waitForURL("**/student/log");
  await instant(page, async () => {
    await page
      .getByRole("navigation", { name: "Student navigation" })
      .getByRole("link", { name: "Assignments" })
      .click();
    await page.waitForURL((target) => target.pathname === "/student");
    await expect(page.getByRole("heading", { name: essay })).toBeVisible();
    await expect(page.getByRole("heading", { name: lab })).toBeVisible();
    await expect(page.getByText("2 steps logged").first()).toBeVisible();
  });
  await letReleasedNavigationSettle(page);
});

test("after signing out the cached assignments are not reachable", async ({
  page,
}) => {
  await signIn(page);
  await page.getByRole("button", { name: /User menu/u }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL((target) => target.pathname === "/");
  await page.goBack();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: essay })).toHaveCount(0);
});

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { createClient } from "@supabase/supabase-js";
import type {
  PostgrestError,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { QueryClient, QueryObserver } from "@tanstack/query-core";
import type { QueryKey } from "@tanstack/query-core";

import { createAnalysisClient } from "@/lib/supabase/analysis";
import type { Database } from "@/lib/supabase/database.types";

import {
  assignmentsQuery,
  invalidateAfterReview,
  invalidateAfterSave,
  invalidateAfterSubmit,
  projectLogQuery,
  reviewsQuery,
  submissionsQuery,
} from "./queries";
import { forbidden, writeReview, writeStep, writeSubmission } from "./writes";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!(url && anonymousKey && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from the local stack (see the README)."
  );
}

const tag = randomUUID().slice(0, 8);
const password = `Integration-${tag}-Pass1!`;
const admin = createAnalysisClient();

const created = {
  assignments: new Set<string>(),
  courses: new Set<string>(),
  projects: new Set<string>(),
  users: new Set<string>(),
};

const must = async <T>(pending: PromiseLike<PostgrestSingleResponse<T>>) => {
  const { data, error } = await pending;
  if (error || data === null) {
    throw error ?? new Error("Fixture query returned no rows.");
  }
  return data;
};

const run = async (pending: PromiseLike<{ error: PostgrestError | null }>) => {
  const { error } = await pending;
  if (error) {
    throw error;
  }
};

const createAccount = async (name: string, role: "student" | "instructor") => {
  const email = `${tag}-${name}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: name },
  });
  if (error) {
    throw error;
  }
  const { id } = data.user;
  created.users.add(id);
  if (role === "instructor") {
    await run(admin.from("profiles").update({ role }).eq("id", id));
  }
  const client = createClient<Database>(url, anonymousKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw signInError;
  }
  return { client, email, id };
};

const buildFixture = async () => {
  const [teacherA, teacherB, s1, s2, s3] = await Promise.all([
    createAccount("teacher-a", "instructor"),
    createAccount("teacher-b", "instructor"),
    createAccount("student-1", "student"),
    createAccount("student-2", "student"),
    createAccount("student-3", "student"),
  ]);
  const courses = await must(
    admin
      .from("courses")
      .insert([
        { code: `A-${tag}`, instructor_id: teacherA.id, title: "Course A" },
        { code: `B-${tag}`, instructor_id: teacherB.id, title: "Course B" },
      ])
      .select("id, code")
  );
  const courseA = courses.find(({ code }) => code === `A-${tag}`)?.id ?? "";
  const courseB = courses.find(({ code }) => code === `B-${tag}`)?.id ?? "";
  created.courses.add(courseA).add(courseB);
  await run(
    admin.from("enrolments").insert([
      { course_id: courseA, email: s1.email, student_id: s1.id },
      { course_id: courseA, email: s2.email, student_id: s2.id },
      { course_id: courseB, email: s3.email, student_id: s3.id },
    ])
  );
  const assignments = await must(
    admin
      .from("assignments")
      .insert([
        { course_id: courseA, lane: "lane_2", title: `${tag} Essay` },
        { course_id: courseA, lane: "lane_1", title: `${tag} Lab` },
        { course_id: courseB, lane: "lane_2", title: `${tag} Other` },
      ])
      .select("id, title")
  );
  const assignmentId = (name: string) =>
    assignments.find(({ title }) => title === `${tag} ${name}`)?.id ?? "";
  for (const { id } of assignments) {
    created.assignments.add(id);
  }
  const projects = await must(
    admin
      .from("projects")
      .insert([
        {
          assignment_id: assignmentId("Essay"),
          course_id: courseA,
          student_id: s1.id,
        },
        {
          assignment_id: assignmentId("Essay"),
          course_id: courseA,
          student_id: s2.id,
        },
        {
          assignment_id: assignmentId("Other"),
          course_id: courseB,
          student_id: s3.id,
        },
      ])
      .select("id, student_id")
  );
  const projectOf = (studentId: string) =>
    projects.find(({ student_id }) => student_id === studentId)?.id ?? "";
  const [p1, p2, p3] = [s1, s2, s3].map(({ id }) => projectOf(id));
  for (const id of [p1, p2, p3]) {
    created.projects.add(id ?? "");
  }
  const steps = await must(
    admin
      .from("iterations")
      .insert([
        {
          ai_tool: "Tool",
          project_id: p1 ?? "",
          prompt: "First",
          raw_answer: "Answer",
          step_number: 1,
        },
        {
          ai_tool: "Tool",
          project_id: p1 ?? "",
          prompt: "Second",
          raw_answer: "Answer",
          step_number: 2,
        },
        {
          ai_tool: "Tool",
          project_id: p2 ?? "",
          prompt: "Only",
          raw_answer: "Answer",
          step_number: 1,
        },
      ])
      .select("id, project_id")
  );
  await run(
    admin
      .from("projects")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", p2 ?? "")
  );
  const finalVersion = await must(
    admin
      .from("final_versions")
      .insert({
        extracted_text: "Final text",
        project_id: p2 ?? "",
        version_number: 1,
      })
      .select("id")
      .single()
  );
  const analysis = await must(
    admin
      .from("analysis_results")
      .insert({
        ai_correctness_addressed: true,
        ai_correctness_evidence: "Evidence",
        analysis_version: "v1",
        changes_addressed: true,
        changes_evidence: "Evidence",
        explanation: "Explanation",
        final_version_id: finalVersion.id,
        iteration_id:
          steps.find(({ project_id }) => project_id === p2)?.id ?? "",
        model: "model",
        project_id: p2 ?? "",
        rubric_version: "rubric",
        uncertainty: "Uncertainty",
        verification_addressed: true,
        verification_evidence: "Evidence",
      })
      .select("id")
      .single()
  );
  const flag = await must(
    admin
      .from("flags")
      .insert({
        analysis_result_id: analysis.id,
        evidence: "Evidence",
        explanation: "Explanation",
        kind: "reflection",
      })
      .select("id")
      .single()
  );
  return {
    flagId: flag.id,
    p1: p1 ?? "",
    p2: p2 ?? "",
    p3: p3 ?? "",
    s1,
    s2,
    s3,
    teacherA,
    teacherB,
    titles: {
      essay: `${tag} Essay`,
      lab: `${tag} Lab`,
      other: `${tag} Other`,
    },
  };
};

const fixture = buildFixture();

const removeFixture = async () => {
  const projects = [...created.projects];
  const courses = [...created.courses];
  const users = [...created.users];
  await admin.from("analysis_results").delete().in("project_id", projects);
  await admin.from("projects").delete().in("id", projects);
  await admin.from("enrolments").delete().in("course_id", courses);
  await admin
    .from("assignments")
    .delete()
    .in("id", [...created.assignments]);
  await admin.from("courses").delete().in("id", courses);
  await admin.from("profiles").delete().in("id", users);
  await Promise.all(users.map((id) => admin.auth.admin.deleteUser(id)));
};

before(async () => {
  await fixture;
});

after(async () => {
  await fixture.catch(() => null);
  await removeFixture();
});

const newQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

const watch = <T>(
  queryClient: QueryClient,
  options: { queryFn: () => Promise<T>; queryKey: QueryKey }
) => new QueryObserver(queryClient, options).subscribe(() => null);

const titlesOf = (rows: { title: string }[]) =>
  rows.map(({ title }) => title).toSorted();

test("students read only their own assignments and progress", async () => {
  const { p1, p2, s1, s2, s3, titles } = await fixture;
  const queryClient = newQueryClient();
  const own = await queryClient.query(assignmentsQuery(s1.client, s1.id));
  assert.deepEqual(titlesOf(own), [titles.essay, titles.lab].toSorted());
  const essay = own.find(({ title }) => title === titles.essay);
  const lab = own.find(({ title }) => title === titles.lab);
  assert.deepEqual(
    essay?.projects.map(({ id }) => id),
    [p1]
  );
  assert.equal(essay?.projects[0]?.iterations[0]?.count, 2);
  assert.deepEqual(lab?.projects, []);
  const peer = await queryClient.query(assignmentsQuery(s2.client, s2.id));
  const peerEssay = peer.find(({ title }) => title === titles.essay);
  assert.deepEqual(
    peerEssay?.projects.map(({ id }) => id),
    [p2]
  );
  const other = await queryClient.query(assignmentsQuery(s3.client, s3.id));
  assert.deepEqual(titlesOf(other), [titles.other]);
});

test("instructors read their own courses' assignments with only submitted projects", async () => {
  const { p2, teacherA, teacherB, titles } = await fixture;
  const queryClient = newQueryClient();
  const taught = await queryClient.query(
    assignmentsQuery(teacherA.client, teacherA.id)
  );
  assert.deepEqual(titlesOf(taught), [titles.essay, titles.lab].toSorted());
  const essay = taught.find(({ title }) => title === titles.essay);
  assert.deepEqual(
    essay?.projects.map(({ id }) => id),
    [p2]
  );
  const elsewhere = await queryClient.query(
    assignmentsQuery(teacherB.client, teacherB.id)
  );
  assert.deepEqual(titlesOf(elsewhere), [titles.other]);
  assert.deepEqual(elsewhere[0]?.projects, []);
});

test("project logs are ordered and visible only to the owner or the course instructor once submitted", async () => {
  const { p1, p2, s1, s2, teacherA, teacherB } = await fixture;
  const queryClient = newQueryClient();
  const log = await queryClient.query(projectLogQuery(s1.client, s1.id, p1));
  assert.deepEqual(
    log.iterations.map(({ step_number }) => step_number),
    [1, 2]
  );
  await Promise.all([
    assert.rejects(
      newQueryClient().query(projectLogQuery(s2.client, s2.id, p1)),
      /Unable to load the project log\./u
    ),
    assert.rejects(
      newQueryClient().query(projectLogQuery(teacherA.client, teacherA.id, p1)),
      /Unable to load the project log\./u
    ),
    assert.rejects(
      newQueryClient().query(projectLogQuery(teacherB.client, teacherB.id, p2)),
      /Unable to load the project log\./u
    ),
  ]);
  const submitted = await queryClient.query(
    projectLogQuery(teacherA.client, teacherA.id, p2)
  );
  assert.equal(submitted.status, "submitted");
  assert.equal(submitted.iterations.length, 1);
});

test("submissions list only the instructor's own submitted projects", async () => {
  const { p2, s1, s2, teacherA, teacherB, titles } = await fixture;
  const queryClient = newQueryClient();
  const submissions = await queryClient.query(
    submissionsQuery(teacherA.client, teacherA.id)
  );
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0]?.id, p2);
  assert.equal(submissions[0]?.student.email, s2.email);
  assert.equal(submissions[0]?.assignment.title, titles.essay);
  const elsewhere = await queryClient.query(
    submissionsQuery(teacherB.client, teacherB.id)
  );
  const students = await queryClient.query(submissionsQuery(s1.client, s1.id));
  assert.deepEqual(elsewhere, []);
  assert.deepEqual(students, []);
});

test("reviews are readable only by the course instructor", async () => {
  const { flagId, p2, s2, teacherA, teacherB } = await fixture;
  const queryClient = newQueryClient();
  const reviews = await queryClient.query(
    reviewsQuery(teacherA.client, teacherA.id, p2)
  );
  assert.equal(reviews.length, 1);
  assert.deepEqual(
    reviews[0]?.flags.map(({ id, review_state }) => [id, review_state]),
    [[flagId, "open"]]
  );
  const asStudent = await queryClient.query(reviewsQuery(s2.client, s2.id, p2));
  const asOtherInstructor = await queryClient.query(
    reviewsQuery(teacherB.client, teacherB.id, p2)
  );
  assert.deepEqual(asStudent, []);
  assert.deepEqual(asOtherInstructor, []);
});

test("a read cannot run with a session that belongs to someone else", async () => {
  const { p1, s1, s2 } = await fixture;
  const anonymous = createClient<Database>(url, anonymousKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const queryClient = newQueryClient();
  await Promise.all([
    assert.rejects(
      queryClient.query(assignmentsQuery(s1.client, s2.id)),
      /session changed/u
    ),
    assert.rejects(
      queryClient.query(projectLogQuery(s1.client, s2.id, p1)),
      /session changed/u
    ),
    assert.rejects(
      queryClient.query(assignmentsQuery(anonymous, s1.id)),
      /session changed/u
    ),
  ]);
  const cached = queryClient.getQueryCache().getAll();
  assert.equal(cached.length, 3);
  assert.ok(cached.every(({ state }) => state.data === undefined));
});

test("saving a step refreshes the log and assignment progress", async () => {
  const { p1, s1 } = await fixture;
  const queryClient = newQueryClient();
  const log = projectLogQuery(s1.client, s1.id, p1);
  const assignments = assignmentsQuery(s1.client, s1.id);
  const stops = [watch(queryClient, log), watch(queryClient, assignments)];
  const initial = await queryClient.query(log);
  assert.equal(initial.iterations.length, 2);
  const result = await writeStep(s1.client, {
    aiTool: "Tool",
    critique: "Checked the answer",
    projectId: p1,
    prompt: "Third",
    rawAnswer: "Answer",
    stepNumber: 3,
  });
  assert.deepEqual(result, {});
  const stale = await queryClient.query(log);
  assert.equal(stale.iterations.length, 2);
  await invalidateAfterSave(queryClient, s1.id, p1);
  const refreshed = await queryClient.query(log);
  assert.deepEqual(
    refreshed.iterations.map(({ critique, step_number }) => [
      step_number,
      critique,
    ]),
    [
      [1, null],
      [2, null],
      [3, "Checked the answer"],
    ]
  );
  const list = await queryClient.query(assignments);
  const progress = list
    .flatMap(({ projects }) => projects)
    .find(({ id }) => id === p1);
  assert.equal(progress?.iterations[0]?.count, 3);
  for (const stop of stops) {
    stop();
  }
});

test("editing a step changes that step and marks AI errors with evidence", async () => {
  const { p1, s1 } = await fixture;
  const queryClient = newQueryClient();
  const log = projectLogQuery(s1.client, s1.id, p1);
  const { iterations } = await queryClient.query(log);
  const [first] = iterations;
  const result = await writeStep(s1.client, {
    aiErrorEvidence: "The citation does not exist",
    aiTool: "Tool",
    id: first?.id ?? "",
    projectId: p1,
    prompt: "First, revised",
    rawAnswer: "Answer",
    stepNumber: 1,
  });
  assert.deepEqual(result, {});
  await invalidateAfterSave(queryClient, s1.id, p1);
  const refreshed = await queryClient.query(log);
  const [edited] = refreshed.iterations;
  assert.equal(edited?.id, first?.id);
  assert.equal(edited?.prompt, "First, revised");
  assert.equal(edited?.student_marked_ai_error, true);
  assert.equal(edited?.ai_error_evidence, "The citation does not exist");
});

test("students cannot write to someone else's log or to a locked or invalid one", async () => {
  const { p1, p2, p3, s1, s2, teacherA } = await fixture;
  const base = {
    aiTool: "Tool",
    prompt: "Prompt",
    rawAnswer: "Answer",
    stepNumber: 9,
  };
  const results = await Promise.all([
    writeStep(s2.client, { ...base, projectId: p1 }),
    writeStep(s1.client, { ...base, projectId: p2 }),
    writeStep(s1.client, { ...base, projectId: p3 }),
    writeStep(teacherA.client, { ...base, projectId: p2 }),
    writeStep(teacherA.client, { ...base, projectId: p1 }),
  ]);
  assert.deepEqual(results, [
    forbidden,
    forbidden,
    forbidden,
    forbidden,
    forbidden,
  ]);
  const duplicate = await writeStep(s1.client, {
    ...base,
    projectId: p1,
    stepNumber: 1,
  });
  assert.deepEqual(duplicate, { error: "That step number is already used." });
});

test("submitting refreshes state, locks the project and rejects other users", async () => {
  const { p1, p3, s1, s2, teacherA } = await fixture;
  const rejected = await Promise.all([
    writeSubmission(s2.client, { projectId: p1 }),
    writeSubmission(s1.client, { projectId: p3 }),
    writeSubmission(teacherA.client, { projectId: p1 }),
  ]);
  assert.deepEqual(rejected, [forbidden, forbidden, forbidden]);
  const queryClient = newQueryClient();
  const assignments = assignmentsQuery(s1.client, s1.id);
  const log = projectLogQuery(s1.client, s1.id, p1);
  const stops = [watch(queryClient, assignments), watch(queryClient, log)];
  const statusOf = async () => {
    const list = await queryClient.query(assignments);
    return list.flatMap(({ projects }) => projects).find(({ id }) => id === p1)
      ?.status;
  };
  assert.equal(await statusOf(), "draft");
  assert.deepEqual(await writeSubmission(s1.client, { projectId: p1 }), {});
  assert.equal(await statusOf(), "draft");
  await invalidateAfterSubmit(queryClient, s1.id, p1);
  assert.equal(await statusOf(), "submitted");
  const submitted = await queryClient.query(log);
  assert.equal(submitted.status, "submitted");
  const again = await writeSubmission(s1.client, { projectId: p1 });
  const late = await writeStep(s1.client, {
    aiTool: "Tool",
    projectId: p1,
    prompt: "Late",
    rawAnswer: "Answer",
    stepNumber: 10,
  });
  assert.deepEqual([again, late], [forbidden, forbidden]);
  const visible = await newQueryClient().query(
    submissionsQuery(teacherA.client, teacherA.id)
  );
  assert.ok(visible.some(({ id }) => id === p1));
  for (const stop of stops) {
    stop();
  }
});

test("reviewing a flag refreshes reviews and keeps the decision history", async () => {
  const { flagId, p2, s2, teacherA, teacherB } = await fixture;
  const rejected = await Promise.all([
    writeReview(s2.client, s2.id, { flagId, state: "dismissed" }),
    writeReview(teacherB.client, teacherB.id, { flagId, state: "dismissed" }),
  ]);
  assert.deepEqual(rejected, [forbidden, forbidden]);
  const queryClient = newQueryClient();
  const reviews = reviewsQuery(teacherA.client, teacherA.id, p2);
  const stop = watch(queryClient, reviews);
  const flagOf = async () => {
    const results = await queryClient.query(reviews);
    return results.flatMap(({ flags }) => flags)[0];
  };
  const initial = await flagOf();
  assert.equal(initial?.review_state, "open");
  const dismiss = await writeReview(teacherA.client, teacherA.id, {
    flagId,
    state: "dismissed",
  });
  assert.deepEqual(dismiss, {});
  const stale = await flagOf();
  assert.equal(stale?.review_state, "open");
  await invalidateAfterReview(queryClient, teacherA.id, p2);
  const dismissed = await flagOf();
  assert.equal(dismissed?.review_state, "dismissed");
  assert.equal(dismissed?.reviewed_by, teacherA.id);
  assert.deepEqual(
    dismissed?.flag_reviews.map(({ review_state }) => review_state),
    ["dismissed"]
  );
  const reopen = await writeReview(teacherA.client, teacherA.id, {
    flagId,
    state: "open",
  });
  assert.deepEqual(reopen, {});
  await invalidateAfterReview(queryClient, teacherA.id, p2);
  const reopened = await flagOf();
  assert.equal(reopened?.review_state, "open");
  assert.deepEqual(
    reopened?.flag_reviews.map(({ review_state }) => review_state).toSorted(),
    ["dismissed", "open"]
  );
  stop();
});

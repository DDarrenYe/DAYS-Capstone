import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { createClient } from "@supabase/supabase-js";
import type {
  SupabaseClient,
  PostgrestError,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { QueryClient, QueryObserver } from "@tanstack/query-core";
import type { QueryKey } from "@tanstack/query-core";

import type { loadShare } from "@/lib/import/share";
import { createAnalysisClient } from "@/lib/supabase/analysis";
import type { Database } from "@/lib/supabase/database.types";

import {
  assignmentsQuery,
  coursesQuery,
  invalidateAfterReview,
  invalidateAfterSave,
  invalidateAfterSubmit,
  projectLogQuery,
  reviewsQuery,
  submissionsQuery,
} from "./queries";
import {
  forbidden,
  writeAssignment,
  writeCourse,
  removeEnrolment,
  writeEnrolments,
  readImport,
  removeStep,
  writeCritique,
  writeImport,
  writeProject,
  writeReview,
  writeSteps,
  writeSubmission,
} from "./writes";

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
  const added = await writeSteps(s1.client, {
    aiTool: "Tool",
    projectId: p1,
    prompt: "Third",
    rawAnswer: "Answer",
  });
  assert.deepEqual(added, { added: 1, firstStep: 3 });
  const stale = await queryClient.query(log);
  assert.equal(stale.iterations.length, 2);
  await invalidateAfterSave(queryClient, s1.id, p1);
  const pending = await queryClient.query(log);
  const third = pending.iterations.find(({ step_number }) => step_number === 3);
  assert.equal(third?.critique, null);
  assert.equal(third?.import_source, "pasted_text");
  const saved = await writeCritique(s1.client, {
    critique: "Checked the answer",
    projectId: p1,
    stepId: third?.id ?? "",
  });
  assert.deepEqual(saved, {});
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

test("a critique marks wrong passages as student-reported errors and leaves the logged text alone", async () => {
  const { p1, s1 } = await fixture;
  const queryClient = newQueryClient();
  const log = projectLogQuery(s1.client, s1.id, p1);
  const { iterations } = await queryClient.query(log);
  const [first] = iterations;
  const marks = [
    {
      end: 6,
      kind: "wrong" as const,
      note: "There is no such answer",
      start: 0,
    },
  ];
  const result = await writeCritique(s1.client, {
    critique: "It was wrong, so I replaced it.",
    marks,
    projectId: p1,
    stepId: first?.id ?? "",
  });
  assert.deepEqual(result, {});
  await invalidateAfterSave(queryClient, s1.id, p1);
  const refreshed = await queryClient.query(log);
  const [edited] = refreshed.iterations;
  assert.equal(edited?.id, first?.id);
  assert.equal(edited?.prompt, "First");
  assert.equal(edited?.raw_answer, "Answer");
  assert.equal(edited?.student_marked_ai_error, true);
  assert.equal(edited?.ai_error_evidence, "“Answer” — There is no such answer");
  assert.deepEqual(edited?.marks, marks);
});

test("students cannot write to someone else's log or to a locked or invalid one", async () => {
  const { p1, p2, p3, s1, s2, teacherA } = await fixture;
  const base = { aiTool: "Tool", prompt: "Prompt", rawAnswer: "Answer" };
  const results = await Promise.all([
    writeSteps(s2.client, { ...base, projectId: p1 }),
    writeSteps(s1.client, { ...base, projectId: p2 }),
    writeSteps(s1.client, { ...base, projectId: p3 }),
    writeSteps(teacherA.client, { ...base, projectId: p2 }),
    writeSteps(teacherA.client, { ...base, projectId: p1 }),
  ]);
  assert.deepEqual(results, [
    forbidden,
    forbidden,
    forbidden,
    forbidden,
    forbidden,
  ]);
  const owned = await must(
    admin.from("iterations").select("id, project_id").in("project_id", [p1, p2])
  );
  const stepOf = (projectId: string) =>
    owned.find(({ project_id }) => project_id === projectId)?.id ?? "";
  const critiques = await Promise.all([
    writeCritique(s2.client, {
      critique: "Mine now",
      projectId: p1,
      stepId: stepOf(p1),
    }),
    writeCritique(s1.client, {
      critique: "Mine now",
      projectId: p2,
      stepId: stepOf(p2),
    }),
    writeCritique(teacherA.client, {
      critique: "Mine now",
      projectId: p2,
      stepId: stepOf(p2),
    }),
    writeCritique(s1.client, {
      critique: "Wrong project",
      projectId: p3,
      stepId: stepOf(p1),
    }),
  ]);
  assert.deepEqual(critiques, [forbidden, forbidden, forbidden, forbidden]);
  const untouched = await must(
    admin
      .from("iterations")
      .select("critique")
      .in("id", [stepOf(p2)])
  );
  assert.deepEqual(untouched, [{ critique: null }]);
});

test("imports add steps in order, once, even when repeated or concurrent with other saves", async () => {
  const { s1, s2 } = await fixture;
  const { data: course } = await admin
    .from("enrolments")
    .select("course_id")
    .eq("student_id", s1.id)
    .single();
  const fresh = await must(
    admin
      .from("assignments")
      .insert({
        course_id: course?.course_id ?? "",
        lane: "lane_2",
        title: `${tag} Import`,
      })
      .select("id")
      .single()
  );
  const chat = [
    { answer: "Answer one", id: "m1", prompt: "Prompt one" },
    { answer: "Answer two", id: "m2", prompt: "Prompt two" },
    { answer: "Answer three", id: "m3", prompt: "Prompt three" },
  ];
  const shareId = "6f2a1c3e-9b4d-4e7a-8c15-0d2b3f4a5e60";
  const load: typeof loadShare = () =>
    Promise.resolve({
      link: {
        id: shareId,
        url: new URL(`https://chatgpt.com/share/${shareId}`),
      },
      omitted: 0,
      steps: chat,
    });
  const shareUrl = `https://chatgpt.com/share/${shareId}`;
  try {
    await writeProject(s1.client, s1.id, { assignmentId: fresh.id });
    const project = await must(
      admin.from("projects").select("id").eq("assignment_id", fresh.id).single()
    );
    const projectId = project.id;
    const outcomes = await Promise.all([
      writeImport(s1.client, { projectId, url: shareUrl }, load),
      writeImport(s1.client, { projectId, url: shareUrl }, load),
      writeImport(s1.client, { projectId, url: shareUrl }, load),
      writeSteps(s1.client, {
        aiTool: "Claude",
        projectId,
        prompt: "Pasted A",
        rawAnswer: "A",
      }),
      writeSteps(s1.client, {
        aiTool: "Claude",
        projectId,
        prompt: "Pasted B",
        rawAnswer: "B",
      }),
    ]);
    assert.deepEqual(
      outcomes.map((outcome) => outcome.error),
      [undefined, undefined, undefined, undefined, undefined]
    );
    assert.deepEqual(
      outcomes
        .slice(0, 3)
        .map((outcome) => outcome.added)
        .toSorted(),
      [0, 0, 3]
    );
    const rows = await must(
      admin
        .from("iterations")
        .select(
          "step_number, prompt, import_source, source_url, source_conversation_id, source_step_id, imported_at, critique"
        )
        .eq("project_id", projectId)
        .order("step_number")
    );
    assert.deepEqual(
      rows.map(({ step_number }) => step_number),
      [1, 2, 3, 4, 5]
    );
    const imported = rows.filter(
      ({ import_source }) => import_source === "public_link"
    );
    assert.deepEqual(
      imported.map(({ prompt }) => prompt),
      ["Prompt one", "Prompt two", "Prompt three"]
    );
    assert.deepEqual(
      imported.map(({ step_number }) => step_number),
      [
        imported[0]?.step_number,
        (imported[0]?.step_number ?? 0) + 1,
        (imported[0]?.step_number ?? 0) + 2,
      ]
    );
    for (const row of imported) {
      assert.equal(row.source_url, shareUrl);
      assert.equal(row.source_conversation_id, shareId);
      assert.ok(row.imported_at);
      assert.equal(row.critique, null);
    }
    const preview = await readImport(
      s1.client,
      { projectId, url: shareUrl },
      load
    );
    assert.deepEqual(
      preview.steps?.map(({ saved }) => saved),
      [true, true, true]
    );
    const again = await writeImport(
      s1.client,
      { projectId, url: shareUrl },
      load
    );
    assert.deepEqual(again, { added: 0, firstStep: undefined });
    const foreign = await readImport(
      s2.client,
      { projectId, url: shareUrl },
      load
    );
    assert.deepEqual(foreign, forbidden);
  } finally {
    await admin.from("projects").delete().eq("assignment_id", fresh.id);
    await admin.from("assignments").delete().eq("id", fresh.id);
  }
});

const withDraft = async (
  student: { client: SupabaseClient<Database>; id: string },
  title: string,
  body: (projectId: string) => Promise<void>
) => {
  const { data: course } = await admin
    .from("enrolments")
    .select("course_id")
    .eq("student_id", student.id)
    .single();
  const assignment = await must(
    admin
      .from("assignments")
      .insert({
        course_id: course?.course_id ?? "",
        lane: "lane_2",
        title: `${tag} ${title}`,
      })
      .select("id")
      .single()
  );
  try {
    await writeProject(student.client, student.id, {
      assignmentId: assignment.id,
    });
    const project = await must(
      admin
        .from("projects")
        .select("id")
        .eq("assignment_id", assignment.id)
        .single()
    );
    await body(project.id);
  } finally {
    await admin.from("projects").delete().eq("assignment_id", assignment.id);
    await admin.from("assignments").delete().eq("id", assignment.id);
  }
};

test("removing a middle step keeps the others attached to their own notes and numbers them in a row", async () => {
  const { s1, s2, teacherA } = await fixture;
  await withDraft(s1, "Remove", async (projectId) => {
    await run(
      admin.from("iterations").insert(
        ["One", "Two", "Three", "Four"].map((name, index) => ({
          ai_tool: "Tool",
          project_id: projectId,
          prompt: name,
          raw_answer: `${name} answer`,
          step_number: index + 1,
        }))
      )
    );
    const steps = () =>
      must(
        admin
          .from("iterations")
          .select("id, step_number, critique")
          .eq("project_id", projectId)
          .order("step_number")
      );
    const [first, second, third, fourth] = await steps();
    await writeCritique(s1.client, {
      critique: "About three",
      projectId,
      stepId: third?.id ?? "",
    });
    const denied = await Promise.all([
      removeStep(s2.client, { projectId, stepId: second?.id ?? "" }),
      removeStep(teacherA.client, { projectId, stepId: second?.id ?? "" }),
      removeStep(s1.client, {
        projectId,
        stepId: "00000000-0000-4000-8000-000000000000",
      }),
    ]);
    assert.deepEqual(denied, [forbidden, forbidden, forbidden]);
    assert.deepEqual(
      await removeStep(s1.client, { projectId, stepId: second?.id ?? "" }),
      {}
    );
    const remaining = await steps();
    assert.deepEqual(
      remaining.map(({ id, step_number }) => [id, step_number]),
      [
        [first?.id, 1],
        [third?.id, 2],
        [fourth?.id, 3],
      ]
    );
    assert.equal(remaining[1]?.critique, "About three");
    const both = await Promise.all([
      removeStep(s1.client, { projectId, stepId: first?.id ?? "" }),
      removeStep(s1.client, { projectId, stepId: fourth?.id ?? "" }),
    ]);
    assert.deepEqual(both, [{}, {}]);
    const last = await steps();
    assert.deepEqual(
      last.map(({ id, step_number }) => [id, step_number]),
      [[third?.id, 1]]
    );
  });
});

test("opening a Lane 2 assignment creates one project, however often it is opened", async () => {
  const { s1, s2, s3, teacherA } = await fixture;
  const { data: course } = await admin
    .from("enrolments")
    .select("course_id")
    .eq("student_id", s1.id)
    .single();
  const fresh = await must(
    admin
      .from("assignments")
      .insert({
        course_id: course?.course_id ?? "",
        lane: "lane_2",
        title: `${tag} Fresh`,
      })
      .select("id")
      .single()
  );
  const lab = await must(
    admin.from("assignments").select("id").eq("title", `${tag} Lab`).single()
  );
  const projectCount = async (assignmentId: string) => {
    const rows = await must(
      admin.from("projects").select("id").eq("assignment_id", assignmentId)
    );
    return rows.length;
  };
  try {
    const opens = await Promise.all([
      writeProject(s1.client, s1.id, { assignmentId: fresh.id }),
      writeProject(s1.client, s1.id, { assignmentId: fresh.id }),
      writeProject(s1.client, s1.id, { assignmentId: fresh.id }),
    ]);
    assert.deepEqual(opens, [{}, {}, {}]);
    assert.equal(await projectCount(fresh.id), 1);
    assert.deepEqual(
      await writeProject(s2.client, s2.id, { assignmentId: fresh.id }),
      {}
    );
    assert.equal(await projectCount(fresh.id), 2);
    const list = await newQueryClient().query(
      assignmentsQuery(s1.client, s1.id)
    );
    const opened = list.find(({ id }) => id === fresh.id);
    assert.equal(opened?.projects.length, 1);
    assert.equal(opened?.projects[0]?.status, "draft");
    const rejected = await Promise.all([
      writeProject(s1.client, s1.id, { assignmentId: lab.id }),
      writeProject(s3.client, s3.id, { assignmentId: fresh.id }),
      writeProject(teacherA.client, teacherA.id, { assignmentId: fresh.id }),
    ]);
    assert.deepEqual(rejected, [forbidden, forbidden, forbidden]);
    assert.equal(await projectCount(lab.id), 0);
  } finally {
    await admin.from("projects").delete().eq("assignment_id", fresh.id);
    await admin.from("assignments").delete().eq("id", fresh.id);
  }
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
  const late = await writeSteps(s1.client, {
    aiTool: "Tool",
    projectId: p1,
    prompt: "Late",
    rawAnswer: "Answer",
  });
  const [firstStep] = submitted.iterations;
  const lateCritique = await writeCritique(s1.client, {
    critique: "Late edit",
    projectId: p1,
    stepId: firstStep?.id ?? "",
  });
  assert.deepEqual(
    [again, late, lateCritique],
    [forbidden, forbidden, forbidden]
  );
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

const outcomes = (results: { address: string; outcome: string }[] = []) =>
  Object.fromEntries(results.map(({ address, outcome }) => [address, outcome]));

test("instructors set up a course whose assignments enrolled and invited students then see", async () => {
  const { s1, teacherA, teacherB } = await fixture;
  const code = `C-${tag}`;
  assert.deepEqual(
    await writeCourse(teacherA.client, teacherA.id, { code, title: "Setup" }),
    {}
  );
  const course = await must(
    admin
      .from("courses")
      .select("id")
      .eq("instructor_id", teacherA.id)
      .eq("code", code)
      .single()
  );
  created.courses.add(course.id);
  const duplicate = await writeCourse(teacherA.client, teacherA.id, {
    code,
    title: "Again",
  });
  assert.deepEqual(duplicate, {
    error: "You already have a course with that code.",
    field: "code",
  });
  const spoofed = await Promise.all([
    writeCourse(s1.client, s1.id, { code: `S-${tag}`, title: "Student" }),
    writeCourse(teacherB.client, teacherA.id, {
      code: `X-${tag}`,
      title: "Spoofed",
    }),
  ]);
  assert.deepEqual(spoofed, [forbidden, forbidden]);

  const title = `${tag} Setup essay`;
  const assignment = {
    brief: "Write it",
    courseId: course.id,
    dueAt: "2026-12-01T06:00:00.000Z",
    lane: "lane_2",
    title,
  } as const;
  assert.deepEqual(await writeAssignment(teacherA.client, assignment), {});
  assert.deepEqual(
    await writeAssignment(teacherB.client, assignment),
    forbidden
  );
  assert.deepEqual(await writeAssignment(s1.client, assignment), forbidden);
  const rows = await must(
    admin.from("assignments").select("id").eq("course_id", course.id)
  );
  assert.equal(rows.length, 1);
  for (const { id } of rows) {
    created.assignments.add(id);
  }

  const lateEmail = `${tag}-late@example.test`;
  const first = await writeEnrolments(teacherA.client, {
    courseId: course.id,
    emails: `${s1.email.toUpperCase()}, ${lateEmail}\n${s1.email} ${teacherB.email} nope`,
  });
  assert.deepEqual(outcomes(first.results), {
    [lateEmail]: "invited",
    nope: "invalid",
    [s1.email]: "enrolled",
    [teacherB.email]: "not_a_student",
  });
  const again = await writeEnrolments(teacherA.client, {
    courseId: course.id,
    emails: `${s1.email} ${lateEmail}`,
  });
  assert.deepEqual(outcomes(again.results), {
    [lateEmail]: "duplicate",
    [s1.email]: "duplicate",
  });
  const foreign = { courseId: course.id, emails: "friend@example.test" };
  assert.deepEqual(await writeEnrolments(teacherB.client, foreign), forbidden);
  assert.deepEqual(await writeEnrolments(s1.client, foreign), forbidden);

  const oopsEmail = `${tag}-oops@example.test`;
  await writeEnrolments(teacherA.client, {
    courseId: course.id,
    emails: oopsEmail,
  });
  const roster = await must(
    admin.from("enrolments").select("id, email").eq("course_id", course.id)
  );
  const enrolmentId = (email: string) =>
    roster.find((row) => row.email === email)?.id ?? "";
  const oops = { enrolmentId: enrolmentId(oopsEmail) };
  assert.deepEqual(await removeEnrolment(teacherB.client, oops), forbidden);
  assert.deepEqual(await removeEnrolment(s1.client, oops), forbidden);
  assert.deepEqual(await removeEnrolment(teacherA.client, oops), {});
  assert.deepEqual(await removeEnrolment(teacherA.client, oops), forbidden);
  const started = await must(
    admin
      .from("projects")
      .insert({
        assignment_id: rows[0]?.id ?? "",
        course_id: course.id,
        student_id: s1.id,
      })
      .select("id")
      .single()
  );
  assert.deepEqual(
    await removeEnrolment(teacherA.client, {
      enrolmentId: enrolmentId(s1.email),
    }),
    { error: "That student has started work, so they can't be removed." }
  );
  const [{ enrolments }] = await newQueryClient().query(
    coursesQuery(teacherA.client, teacherA.id)
  );
  assert.equal(
    enrolments.find((row) => row.email === s1.email)?.has_work,
    true
  );
  await run(admin.from("projects").delete().eq("id", started.id));

  const late = await createAccount("late", "student");
  const queryClient = newQueryClient();
  const seen = await Promise.all(
    [s1, late].map(({ client, id }) =>
      queryClient.query(assignmentsQuery(client, id))
    )
  );
  for (const visible of seen) {
    const row = visible.find((candidate) => candidate.title === title);
    assert.equal(row?.lane, "lane_2");
    assert.equal(row?.due_at, "2026-12-01T06:00:00+00:00");
  }
  const profiles = await must(
    admin.from("profiles").select("id, role").in("id", [late.id, teacherB.id])
  );
  assert.deepEqual(
    Object.fromEntries(profiles.map(({ id, role }) => [id, role])),
    { [late.id]: "student", [teacherB.id]: "instructor" }
  );
});

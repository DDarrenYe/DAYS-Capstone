"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { SubmitEvent } from "react";

import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { coursesQuery } from "@/lib/data/queries";
import type { CourseRows } from "@/lib/data/queries";
import {
  useCreateAssignment,
  useCreateCourse,
  useEnrolStudents,
  useRemoveStudent,
} from "@/lib/data/use-mutations";
import { createClient } from "@/lib/supabase/browser";

const dueDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  weekday: "short",
});

const outcomeLabels = new Map([
  ["duplicate", "already on this course"],
  ["enrolled", "enrolled"],
  ["invalid", "not a valid email address"],
  ["invited", "invited, joins when they sign up"],
  ["not_a_student", "is an instructor account, not enrolled"],
]);

const labelClassName = "text-label text-body font-emphasis";

const submitForm =
  (submit: (data: FormData, form: HTMLFormElement) => void) =>
  (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(new FormData(event.currentTarget), event.currentTarget);
  };

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

const FormError = ({ error }: { error: Error | null }) => (
  <p aria-live="polite" className="text-destructive text-xs empty:hidden">
    {error?.message}
  </p>
);

const NewCourseForm = ({ userId }: { userId: string }) => {
  const { error, isPending, mutate } = useCreateCourse(userId);
  return (
    <form
      className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
      onSubmit={submitForm((data, form) =>
        mutate(
          { code: field(data, "code"), title: field(data, "title") },
          { onSuccess: () => form.reset() }
        )
      )}
    >
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor="course-code">
          Course code
        </label>
        <Input id="course-code" maxLength={200} name="code" required />
      </div>
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor="course-title">
          Course title
        </label>
        <Input id="course-title" maxLength={200} name="title" required />
      </div>
      <Button disabled={isPending} size="lg" type="submit">
        {isPending ? "Creating…" : "Create course"}
      </Button>
      <div className="sm:col-span-3">
        <FormError error={error} />
      </div>
    </form>
  );
};

const NewAssignmentForm = ({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) => {
  const { error, isPending, mutate } = useCreateAssignment(userId);
  return (
    <form
      className="grid gap-4"
      onSubmit={submitForm((data, form) => {
        const due = field(data, "dueAt");
        mutate(
          {
            brief: field(data, "brief"),
            courseId,
            dueAt: due ? new Date(due).toISOString() : null,
            lane: field(data, "lane") === "lane_1" ? "lane_1" : "lane_2",
            title: field(data, "title"),
          },
          { onSuccess: () => form.reset() }
        );
      })}
    >
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor={`title-${courseId}`}>
          Assignment title
        </label>
        <Input id={`title-${courseId}`} maxLength={200} name="title" required />
      </div>
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor={`brief-${courseId}`}>
          Brief
        </label>
        <Textarea id={`brief-${courseId}`} name="brief" />
      </div>
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor={`due-${courseId}`}>
          Due date
        </label>
        <Input id={`due-${courseId}`} name="dueAt" type="datetime-local" />
      </div>
      <RadioGroup aria-label="Lane" defaultValue="lane_2" name="lane">
        {[
          {
            label: "Lane 2 · AI allowed, students keep an AI log",
            value: "lane_2",
          },
          { label: "Lane 1 · AI restricted", value: "lane_1" },
        ].map((option) => (
          <label className="flex items-center gap-2.5" key={option.value}>
            <RadioGroupItem value={option.value} />
            {option.label}
          </label>
        ))}
      </RadioGroup>
      <FormError error={error} />
      <Button className="w-fit" disabled={isPending} size="lg" type="submit">
        {isPending ? "Adding…" : "Add assignment"}
      </Button>
    </form>
  );
};

const EnrolForm = ({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) => {
  const { data, error, isPending, mutate } = useEnrolStudents(userId);
  return (
    <form
      className="grid gap-4"
      onSubmit={submitForm((values, form) =>
        mutate(
          { courseId, emails: field(values, "emails") },
          { onSuccess: () => form.reset() }
        )
      )}
    >
      <div className="grid gap-2">
        <label className={labelClassName} htmlFor={`emails-${courseId}`}>
          Student email addresses
        </label>
        <Textarea
          id={`emails-${courseId}`}
          name="emails"
          placeholder="Paste addresses separated by spaces, commas or new lines"
          required
        />
      </div>
      <FormError error={error} />
      <Button className="w-fit" disabled={isPending} size="lg" type="submit">
        {isPending ? "Enrolling…" : "Enrol students"}
      </Button>
      {data ? (
        <ul aria-label="Enrolment results" className="text-ui grid gap-1">
          {data.map(({ address, outcome }) => (
            <li key={address}>
              {address}: {outcomeLabels.get(outcome) ?? outcome}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
};

const StudentRow = ({
  enrolment,
  userId,
}: {
  enrolment: CourseRows[number]["enrolments"][number];
  userId: string;
}) => {
  const { error, isPending, mutate } = useRemoveStudent(userId);
  const locked = Boolean(enrolment.has_work);
  return (
    <li className="grid gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <span>{enrolment.email}</span>
        {enrolment.student_id ? null : <Badge>Invited</Badge>}
        <Tooltip disabled={!locked}>
          <TooltipTrigger render={<span className="ml-auto" />}>
            <Button
              aria-label={
                locked
                  ? `${enrolment.email} has started work and can't be removed`
                  : `Remove ${enrolment.email}`
              }
              disabled={locked || isPending}
              onClick={() => mutate({ enrolmentId: enrolment.id })}
              size="icon-sm"
              variant="ghost"
            >
              <Icon name="x" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            Has started work, can&apos;t be removed
          </TooltipContent>
        </Tooltip>
      </div>
      <FormError error={error} />
    </li>
  );
};

const CourseCard = ({
  course,
  userId,
}: {
  course: CourseRows[number];
  userId: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>
        {course.code} · {course.title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-8 min-[1100px]:grid-cols-2">
        <section
          aria-label={`${course.code} assignments`}
          className="grid content-start gap-5"
        >
          <h3 className="font-heading">Assignments</h3>
          {course.assignments.length === 0 ? (
            <p className="text-muted-foreground">No assignments yet.</p>
          ) : (
            <ul className="grid gap-3">
              {course.assignments.map((assignment) => (
                <li
                  className="flex flex-wrap items-center gap-3"
                  key={assignment.id}
                >
                  <Badge
                    variant={assignment.lane === "lane_2" ? "ai" : "default"}
                  >
                    {assignment.lane === "lane_2" ? "Lane 2" : "Lane 1"}
                  </Badge>
                  <span className="font-emphasis">{assignment.title}</span>
                  {assignment.due_at ? (
                    <time
                      className="text-muted-foreground"
                      dateTime={assignment.due_at}
                      suppressHydrationWarning
                    >
                      Due {dueDate.format(new Date(assignment.due_at))}
                    </time>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <NewAssignmentForm courseId={course.id} userId={userId} />
        </section>
        <section
          aria-label={`${course.code} students`}
          className="grid content-start gap-5"
        >
          <h3 className="font-heading">
            Students · {course.enrolments.length}
          </h3>
          {course.enrolments.length === 0 ? (
            <p className="text-muted-foreground">No students yet.</p>
          ) : (
            <TooltipProvider>
              <ul className="grid max-h-80 gap-2 overflow-y-auto">
                {course.enrolments.map((enrolment) => (
                  <StudentRow
                    enrolment={enrolment}
                    key={enrolment.id}
                    userId={userId}
                  />
                ))}
              </ul>
            </TooltipProvider>
          )}
          <EnrolForm courseId={course.id} userId={userId} />
        </section>
      </div>
    </CardContent>
  </Card>
);

export const CourseSetup = ({
  userId,
  initialCourses,
  fetchedAt,
}: {
  userId: string;
  initialCourses: CourseRows;
  fetchedAt: number;
}) => {
  const { data: courses } = useSuspenseQuery({
    ...coursesQuery(createClient(), userId),
    initialData: initialCourses,
    initialDataUpdatedAt: fetchedAt,
  });
  return (
    <div className="mt-5 grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>New course</CardTitle>
        </CardHeader>
        <CardContent>
          <NewCourseForm userId={userId} />
        </CardContent>
      </Card>
      {courses.map((course) => (
        <CourseCard course={course} key={course.id} userId={userId} />
      ))}
    </div>
  );
};

export const CourseSetupSkeleton = () => (
  <>
    <output className="sr-only">Loading courses…</output>
    <div
      aria-hidden="true"
      className="bg-muted shadow-hairline mt-5 h-62 animate-pulse rounded-xl motion-reduce:animate-none"
    />
  </>
);

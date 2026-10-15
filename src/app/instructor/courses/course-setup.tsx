"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { SwapText } from "@/components/swap-text";
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
  assignmentFormSchema,
  courseSchema,
  enrolFormSchema,
} from "@/lib/data/schemas";
import type { AssignmentFormValues } from "@/lib/data/schemas";
import {
  WriteError,
  useCreateAssignment,
  useCreateCourse,
  useEnrolStudents,
  useRemoveStudent,
} from "@/lib/data/use-mutations";
import type { AssignmentInput } from "@/lib/data/writes";
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

interface Issue {
  message: string;
}

const firstMessage = (errors: readonly (Issue | undefined)[]) =>
  errors.find(Boolean)?.message;

const FormError = ({ errors }: { errors: readonly (Issue | undefined)[] }) => (
  <p aria-live="polite" className="text-destructive text-xs empty:hidden">
    {firstMessage(errors)}
  </p>
);

interface ControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

const FieldShell = ({
  id,
  label,
  errors,
  children,
}: {
  id: string;
  label: string;
  errors: readonly (Issue | undefined)[];
  children: (control: ControlProps) => ReactNode;
}) => {
  const message = firstMessage(errors);
  return (
    <div className="grid gap-2">
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>
      {children({
        "aria-describedby": message ? `${id}-error` : undefined,
        "aria-invalid": message ? true : undefined,
        id,
      })}
      <p
        aria-live="polite"
        className="text-destructive text-xs empty:hidden"
        id={`${id}-error`}
      >
        {message}
      </p>
    </div>
  );
};

const submitted = async <T,>(run: () => Promise<T>) => {
  try {
    await run();
    return null;
  } catch (error) {
    if (error instanceof WriteError && error.field) {
      return { fields: { [error.field]: { message: error.message } } };
    }
    return {
      fields: {},
      form: {
        message:
          error instanceof Error ? error.message : "Unable to save. Try again.",
      },
    };
  }
};

const NewCourseForm = ({ userId }: { userId: string }) => {
  const { mutateAsync } = useCreateCourse(userId);
  const form = useForm({
    defaultValues: { code: "", title: "" },
    onSubmit: ({ formApi }) => formApi.reset(),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: courseSchema,
      onSubmitAsync: ({ value }) => submitted(() => mutateAsync(value)),
    },
  });
  return (
    <form
      className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-start"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="code">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id="course-code"
            label="Course code"
          >
            {(control) => (
              <Input
                {...control}
                maxLength={200}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Field name="title">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id="course-title"
            label="Course title"
          >
            {(control) => (
              <Input
                {...control}
                maxLength={200}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="grid gap-2">
            <span
              aria-hidden="true"
              className={`${labelClassName} invisible max-sm:hidden`}
            >
              &nbsp;
            </span>
            <Button disabled={isSubmitting} size="lg" type="submit">
              <SwapText>
                {isSubmitting ? "Creating…" : "Create course"}
              </SwapText>
            </Button>
          </div>
        )}
      </form.Subscribe>
      <div className="sm:col-span-3">
        <form.Subscribe selector={(state) => [state.errorMap.onSubmit]}>
          {(errors) => <FormError errors={errors} />}
        </form.Subscribe>
      </div>
    </form>
  );
};

const emptyAssignment: AssignmentFormValues = {
  brief: "",
  dueAt: "",
  lane: "lane_2",
  title: "",
};

const lanes: { label: string; value: AssignmentInput["lane"] }[] = [
  { label: "Lane 2 · AI allowed, students keep an AI log", value: "lane_2" },
  { label: "Lane 1 · AI restricted", value: "lane_1" },
];

const NewAssignmentForm = ({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) => {
  const { mutateAsync } = useCreateAssignment(userId);
  const form = useForm({
    defaultValues: emptyAssignment,
    onSubmit: ({ formApi }) => formApi.reset(),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: assignmentFormSchema,
      onSubmitAsync: ({ value }) =>
        submitted(() =>
          mutateAsync({
            brief: value.brief,
            courseId,
            dueAt: value.dueAt ? new Date(value.dueAt).toISOString() : null,
            lane: value.lane,
            title: value.title,
          })
        ),
    },
  });
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id={`title-${courseId}`}
            label="Assignment title"
          >
            {(control) => (
              <Input
                {...control}
                maxLength={200}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Field name="brief">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id={`brief-${courseId}`}
            label="Brief"
          >
            {(control) => (
              <Textarea
                {...control}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Field name="dueAt">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id={`due-${courseId}`}
            label="Due date"
          >
            {(control) => (
              <Input
                {...control}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                type="datetime-local"
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Field name="lane">
        {(field) => (
          <RadioGroup
            aria-label="Lane"
            onValueChange={(value) => {
              const parsed = assignmentFormSchema.shape.lane.safeParse(value);
              if (parsed.success) {
                field.handleChange(parsed.data);
              }
            }}
            value={field.state.value}
          >
            {lanes.map((option) => (
              <label className="flex items-center gap-2.5" key={option.value}>
                <RadioGroupItem value={option.value} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.errorMap.onSubmit]}>
        {(errors) => <FormError errors={errors} />}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            className="w-fit"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            <SwapText>{isSubmitting ? "Adding…" : "Add assignment"}</SwapText>
          </Button>
        )}
      </form.Subscribe>
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
  const { data, mutateAsync } = useEnrolStudents(userId);
  const form = useForm({
    defaultValues: { emails: "" },
    onSubmit: ({ formApi }) => formApi.reset(),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: enrolFormSchema,
      onSubmitAsync: ({ value }) =>
        submitted(() => mutateAsync({ courseId, emails: value.emails })),
    },
  });
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="emails">
        {(field) => (
          <FieldShell
            errors={field.state.meta.errors}
            id={`emails-${courseId}`}
            label="Student email addresses"
          >
            {(control) => (
              <Textarea
                {...control}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Paste addresses separated by spaces, commas or new lines"
                required
                value={field.state.value}
              />
            )}
          </FieldShell>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.errorMap.onSubmit]}>
        {(errors) => <FormError errors={errors} />}
      </form.Subscribe>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            className="w-fit"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            <SwapText>
              {isSubmitting ? "Enrolling…" : "Enrol students"}
            </SwapText>
          </Button>
        )}
      </form.Subscribe>
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
      <FormError errors={[error ?? undefined]} />
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

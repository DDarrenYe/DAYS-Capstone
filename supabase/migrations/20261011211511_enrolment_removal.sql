grant delete on public.enrolments to authenticated;
create policy enrolments_instructor_delete on public.enrolments for delete to authenticated
  using (private.teaches(course_id));

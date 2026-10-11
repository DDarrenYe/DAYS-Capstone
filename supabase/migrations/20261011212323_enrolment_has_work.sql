create function public.has_work(enrolment public.enrolments) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.teaches(enrolment.course_id) and exists (
    select 1 from public.projects p
    where p.course_id = enrolment.course_id and p.student_id = enrolment.student_id);
$$;
revoke all on function public.has_work(public.enrolments) from public, anon;
grant execute on function public.has_work(public.enrolments) to authenticated;

create function private.teaches_student(student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrolments e
    where e.student_id = student and private.teaches(e.course_id));
$$;
revoke all on function private.teaches_student(uuid) from public, anon, authenticated;
grant execute on function private.teaches_student(uuid) to authenticated;

create policy profiles_instructor_students on public.profiles for select to authenticated
  using (private.teaches_student(id));

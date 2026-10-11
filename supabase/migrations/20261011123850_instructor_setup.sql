create function private.is_instructor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor');
$$;
revoke all on function private.is_instructor() from public, anon, authenticated;
grant execute on function private.is_instructor() to authenticated;

grant insert (instructor_id, code, title) on public.courses to authenticated;
grant insert (course_id, title, brief, due_at, lane) on public.assignments to authenticated;
create policy courses_instructor_insert on public.courses for insert to authenticated
  with check (instructor_id = (select auth.uid()) and private.is_instructor());
create policy assignments_instructor_insert on public.assignments for insert to authenticated
  with check (private.teaches(course_id));

create function public.enrol_students(course uuid, emails text[])
returns table (address text, outcome text)
language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid;
  account_role public.profile_role;
  enrolled_id uuid;
begin
  if not private.teaches(course) then
    raise insufficient_privilege using message = 'Only the course instructor can enrol students';
  end if;
  for address in select distinct lower(btrim(entry)) from unnest(emails) as entry order by 1 loop
    if address not like '%_@_%._%' then
      outcome := 'invalid';
      return next;
      continue;
    end if;
    select u.id, p.role into account_id, account_role
    from auth.users u join public.profiles p on p.id = u.id
    where u.email = address and u.email_confirmed_at is not null;
    if account_role = 'instructor' then
      outcome := 'not_a_student';
    else
      insert into public.enrolments (course_id, student_id, email)
      values (course, account_id, address)
      on conflict do nothing
      returning id into enrolled_id;
      outcome := case
        when enrolled_id is null then 'duplicate'
        when account_id is null then 'invited'
        else 'enrolled'
      end;
    end if;
    return next;
  end loop;
end;
$$;
revoke all on function public.enrol_students(uuid, text[]) from public, anon;
grant execute on function public.enrol_students(uuid, text[]) to authenticated;

create function private.claim_enrolments() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.enrolments e set student_id = new.id
  where e.student_id is null and e.email = lower(btrim(new.email))
    and exists (select 1 from public.profiles where id = new.id and role = 'student')
    and not exists (select 1 from public.enrolments o where o.course_id = e.course_id and o.student_id = new.id);
  return null;
end;
$$;
revoke all on function private.claim_enrolments() from public, anon, authenticated;
create trigger auth_user_profile_claims after insert or update of email, email_confirmed_at on auth.users
  for each row when (new.email_confirmed_at is not null) execute function private.claim_enrolments();

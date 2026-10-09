create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Student'), 'student');
  return new;
end;
$$;
revoke all on function private.create_profile() from public, anon, authenticated;
create trigger auth_user_profile after insert on auth.users
  for each row execute function private.create_profile();
insert into public.profiles (id, display_name, role)
select id, coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''), 'Student'), 'student'
from auth.users on conflict (id) do nothing;

create function private.is_student() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'student');
$$;
create function private.teaches(course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c join public.profiles p on p.id = c.instructor_id
    where c.id = course and p.id = auth.uid() and p.role = 'instructor');
$$;
create function private.enrolled(course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_student() and exists (select 1 from public.enrolments
    where course_id = course and student_id = auth.uid());
$$;
create function private.reads_project(project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = project and
    ((p.student_id = auth.uid() and private.enrolled(p.course_id)) or
     (p.status = 'submitted' and private.teaches(p.course_id))));
$$;
create function private.edits_project(project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p join public.assignments a on a.id = p.assignment_id
    where p.id = project and p.student_id = auth.uid() and p.status = 'draft'
    and a.lane = 'lane_2' and private.enrolled(p.course_id));
$$;
create function private.reviews_project(project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = project
    and p.status = 'submitted' and private.teaches(p.course_id));
$$;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_student(), private.teaches(uuid), private.enrolled(uuid),
  private.reads_project(uuid), private.edits_project(uuid), private.reviews_project(uuid) to authenticated;

revoke all on public.profiles, public.courses, public.enrolments, public.assignments,
  public.projects, public.iterations, public.final_versions, public.analysis_results,
  public.flags, public.flag_reviews, public.grader_notes from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.courses, public.enrolments, public.assignments,
  public.projects, public.iterations, public.final_versions, public.analysis_results,
  public.flags, public.flag_reviews, public.grader_notes to service_role;
grant select on public.profiles, public.courses, public.enrolments, public.assignments,
  public.projects, public.iterations, public.analysis_results, public.flags,
  public.flag_reviews, public.grader_notes to authenticated;
grant select (id, project_id, version_number, extracted_text, original_filename, is_current,
  submitted_at, created_at) on public.final_versions to authenticated;
grant insert (id, assignment_id, course_id, student_id) on public.projects to authenticated;
grant update (status, submitted_at) on public.projects to authenticated;
grant delete on public.projects to authenticated;
grant insert (id, project_id, step_number, ai_tool, prompt, raw_answer, critique, import_source,
  source_url, source_conversation_id, source_step_id, imported_at, student_marked_ai_error, ai_error_evidence),
  update (step_number, ai_tool, prompt, raw_answer, critique, import_source, source_url,
  source_conversation_id, source_step_id, imported_at, student_marked_ai_error, ai_error_evidence),
  delete on public.iterations to authenticated;
grant insert (id, project_id, version_number, extracted_text, original_filename, is_current),
  update (is_current, submitted_at), delete on public.final_versions to authenticated;
grant update (review_state, reviewed_by, reviewed_at) on public.flags to authenticated;
grant insert (id, project_id, iteration_id, final_version_id, author_id, body),
  update (body), delete on public.grader_notes to authenticated;

create policy profiles_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy courses_member on public.courses for select to authenticated
  using (private.teaches(id) or private.enrolled(id));
create policy enrolments_member on public.enrolments for select to authenticated
  using ((student_id = (select auth.uid()) and private.is_student()) or private.teaches(course_id));
create policy assignments_member on public.assignments for select to authenticated
  using (private.teaches(course_id) or private.enrolled(course_id));
create policy projects_reader on public.projects for select to authenticated using (private.reads_project(id));
create policy projects_student_insert on public.projects for insert to authenticated
  with check (student_id = (select auth.uid()) and private.enrolled(course_id) and status = 'draft');
create policy projects_student_update on public.projects for update to authenticated
  using (private.edits_project(id)) with check (student_id = (select auth.uid()) and private.enrolled(course_id));
create policy projects_student_delete on public.projects for delete to authenticated using (private.edits_project(id));
create policy iterations_reader on public.iterations for select to authenticated using (private.reads_project(project_id));
create policy iterations_student_insert on public.iterations for insert to authenticated with check (private.edits_project(project_id));
create policy iterations_student_update on public.iterations for update to authenticated
  using (private.edits_project(project_id)) with check (private.edits_project(project_id));
create policy iterations_student_delete on public.iterations for delete to authenticated using (private.edits_project(project_id));
create policy final_versions_reader on public.final_versions for select to authenticated using (private.reads_project(project_id));
create policy final_versions_student_insert on public.final_versions for insert to authenticated with check (private.edits_project(project_id));
create policy final_versions_student_update on public.final_versions for update to authenticated
  using (private.edits_project(project_id)) with check (private.edits_project(project_id));
create policy final_versions_student_delete on public.final_versions for delete to authenticated using (private.edits_project(project_id));
create policy analysis_results_instructor on public.analysis_results for select to authenticated using (private.reviews_project(project_id));
create policy flags_instructor on public.flags for select to authenticated using (
  exists (select 1 from public.analysis_results a where a.id = analysis_result_id and private.reviews_project(a.project_id)));
create policy flags_instructor_review on public.flags for update to authenticated using (
  exists (select 1 from public.analysis_results a where a.id = analysis_result_id and private.reviews_project(a.project_id)))
  with check (reviewed_by = (select auth.uid()) and reviewed_at is not null and
    exists (select 1 from public.analysis_results a where a.id = analysis_result_id and private.reviews_project(a.project_id)));
create policy flag_reviews_instructor on public.flag_reviews for select to authenticated using (
  exists (select 1 from public.flags f where f.id = flag_id));
create policy grader_notes_instructor on public.grader_notes for select to authenticated using (private.reviews_project(project_id));
create policy grader_notes_author_insert on public.grader_notes for insert to authenticated
  with check (author_id = (select auth.uid()) and private.reviews_project(project_id));
create policy grader_notes_author_update on public.grader_notes for update to authenticated
  using (author_id = (select auth.uid()) and private.reviews_project(project_id))
  with check (author_id = (select auth.uid()) and private.reviews_project(project_id));
create policy grader_notes_author_delete on public.grader_notes for delete to authenticated
  using (author_id = (select auth.uid()) and private.reviews_project(project_id));

create function private.lock_student_draft() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  draft public.projects;
begin
  if current_setting('role') = 'authenticated' then
    if tg_op = 'DELETE' then target := old.project_id; else target := new.project_id; end if;
    select * into draft from public.projects where id = target for update;
    if draft.id is null and tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if;
    if draft.id is null or draft.status <> 'draft' or draft.student_id <> auth.uid()
      or not private.enrolled(draft.course_id) then
      raise insufficient_privilege using message = 'Only the enrolled student can edit a draft';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.lock_student_draft() from public, anon, authenticated;
create trigger iterations_lock_draft before insert or update or delete on public.iterations
  for each row execute function private.lock_student_draft();
create trigger final_versions_lock_draft before insert or update or delete on public.final_versions
  for each row execute function private.lock_student_draft();

alter function public.record_flag_review() security definer;
revoke all on function public.record_flag_review() from public, anon, authenticated;

alter function public.enforce_project_lane() security definer;
revoke all on function public.enforce_project_lane(), public.protect_assignment_lane(),
  public.protect_iteration_identity(), public.protect_final_version_text() from public, anon, authenticated;

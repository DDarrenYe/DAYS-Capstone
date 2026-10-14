create function public.submit_project(project uuid)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  draft public.projects;
  missing text;
  final_id uuid;
begin
  select p.* into draft from public.projects p
    where p.id = project and p.student_id = auth.uid() and private.enrolled(p.course_id)
    for update;
  if not found then
    raise insufficient_privilege using message = 'Only the enrolled student can submit this log';
  end if;
  if draft.status = 'submitted' then
    return draft.submitted_at;
  end if;
  if not private.edits_project(project) then
    raise insufficient_privilege using message = 'Only a Lane 2 draft can be submitted';
  end if;
  if not exists (select 1 from public.iterations i where i.project_id = project) then
    raise exception 'Add at least one step before you submit.';
  end if;
  select string_agg('step ' || i.step_number, ', ' order by i.step_number) into missing
    from public.iterations i
    where i.project_id = project and (i.critique is null or btrim(i.critique) = '');
  if missing is not null then
    raise exception 'Add a critique to every step before you submit. Still missing: %.', missing;
  end if;
  select f.id into final_id from public.final_versions f
    where f.project_id = project and f.is_current and btrim(f.extracted_text) <> '';
  if final_id is null then
    raise exception 'Save your final version before you submit.';
  end if;
  update public.final_versions f set submitted_at = now() where f.id = final_id;
  update public.projects p set status = 'submitted', submitted_at = now()
    where p.id = project returning p.submitted_at into draft.submitted_at;
  return draft.submitted_at;
end;
$$;
revoke all on function public.submit_project(uuid) from public, anon;
grant execute on function public.submit_project(uuid) to authenticated;

alter policy projects_student_update on public.projects
  with check (student_id = (select auth.uid()) and private.enrolled(course_id) and status = 'draft' and submitted_at is null);
revoke update (submitted_at) on public.final_versions from authenticated;

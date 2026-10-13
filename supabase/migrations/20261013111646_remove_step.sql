create function public.remove_step(project uuid, step uuid)
returns void
language plpgsql set search_path = '' as $$
declare
  removed integer;
begin
  perform 1 from public.projects p where p.id = project for update;
  if not found then
    raise insufficient_privilege using message = 'Only the enrolled student can edit a draft';
  end if;
  delete from public.iterations i where i.id = step and i.project_id = project
    returning i.step_number into removed;
  if not found then
    raise insufficient_privilege using message = 'That step is not in your draft';
  end if;
  set constraints public.iterations_project_id_step_number_key deferred;
  update public.iterations i set step_number = i.step_number - 1
    where i.project_id = project and i.step_number > removed;
end;
$$;
revoke all on function public.remove_step(uuid, uuid) from public, anon;
grant execute on function public.remove_step(uuid, uuid) to authenticated;

grant insert (marks), update (marks) on public.iterations to authenticated;

create function public.add_steps(project uuid, steps jsonb)
returns table (id uuid, step_number integer)
language plpgsql set search_path = '' as $$
#variable_conflict use_column
declare
  last_number integer;
begin
  perform 1 from public.projects p where p.id = project for update;
  if not found then
    raise insufficient_privilege using message = 'Only the enrolled student can edit a draft';
  end if;
  select coalesce(max(i.step_number), 0) into last_number from public.iterations i where i.project_id = project;
  return query
  insert into public.iterations as i (project_id, step_number, ai_tool, prompt, raw_answer, import_source,
    source_url, source_conversation_id, source_step_id, imported_at)
  select project, last_number + row_number() over (order by e.position),
    e.item ->> 'ai_tool', e.item ->> 'prompt', e.item ->> 'raw_answer',
    (e.item ->> 'import_source')::public.import_source,
    e.item ->> 'source_url', e.item ->> 'source_conversation_id', e.item ->> 'source_step_id',
    case when e.item ->> 'import_source' = 'manual' then null else now() end
  from jsonb_array_elements(steps) with ordinality as e(item, position)
  where not exists (
    select 1 from public.iterations d
    where d.project_id = project and d.ai_tool = e.item ->> 'ai_tool'
      and d.source_conversation_id = e.item ->> 'source_conversation_id'
      and d.source_step_id = e.item ->> 'source_step_id')
  returning i.id, i.step_number;
end;
$$;
revoke all on function public.add_steps(uuid, jsonb) from public, anon;
grant execute on function public.add_steps(uuid, jsonb) to authenticated;

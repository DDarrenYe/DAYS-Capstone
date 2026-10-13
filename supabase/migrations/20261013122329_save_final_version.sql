create function public.save_final_version(project uuid, base integer, body text, filename text default null)
returns table (id uuid, version_number integer, created_at timestamptz)
language plpgsql set search_path = '' as $$
#variable_conflict use_column
declare
  last_number integer;
begin
  perform 1 from public.projects p where p.id = project for update;
  if not found then
    raise insufficient_privilege using message = 'Only the enrolled student can edit a draft';
  end if;
  select coalesce(max(f.version_number), 0) into last_number from public.final_versions f where f.project_id = project;
  if last_number <> base then
    raise serialization_failure using message = 'The final version changed somewhere else';
  end if;
  update public.final_versions f set is_current = false where f.project_id = project and f.is_current;
  return query
  insert into public.final_versions as f (project_id, version_number, extracted_text, original_filename)
  values (project, last_number + 1, body, filename)
  returning f.id, f.version_number, f.created_at;
end;
$$;
revoke all on function public.save_final_version(uuid, integer, text, text) from public, anon;
grant execute on function public.save_final_version(uuid, integer, text, text) to authenticated;

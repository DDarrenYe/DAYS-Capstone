create function public.start_analysis(project uuid, restart boolean, stale_after integer)
returns text
language plpgsql set search_path = '' as $$
declare
  submitted public.projects;
  run text;
begin
  select p.* into submitted from public.projects p
    where p.id = project and p.status = 'submitted'
    for update;
  if not found then
    return null;
  end if;
  if submitted.analysis_status = 'running'
    and submitted.analysis_started_at > now() - make_interval(secs => stale_after) then
    return null;
  end if;
  if submitted.analysis_status in ('completed', 'failed') and not restart then
    return null;
  end if;
  select 'analysis-v' || (count(distinct a.analysis_version) + 1) into run
    from public.analysis_results a where a.project_id = project;
  update public.projects p set
    analysis_status = 'running',
    analysis_version = run,
    analysis_error = null,
    analysis_started_at = now(),
    analysis_finished_at = null
    where p.id = project;
  return run;
end;
$$;

create function public.complete_analysis(project uuid, run text, results jsonb)
returns void
language plpgsql set search_path = '' as $$
declare
  running public.projects;
  final_id uuid;
  item record;
  flagged record;
  result_id uuid;
  earlier_state public.flag_review_state;
  earlier_by uuid;
  earlier_at timestamptz;
  keep boolean;
begin
  select p.* into running from public.projects p where p.id = project for update;
  if not found or running.analysis_status <> 'running' or running.analysis_version is distinct from run then
    raise exception 'This analysis run is no longer the current one.';
  end if;
  select f.id into final_id from public.final_versions f
    where f.project_id = project and f.is_current and f.submitted_at is not null;
  if final_id is null then
    raise exception 'The submission has no final version to analyse.';
  end if;
  if jsonb_typeof(results) is distinct from 'array' then
    raise exception 'The analysis results must be a list.';
  end if;
  if jsonb_array_length(results) <> (select count(*) from public.iterations i where i.project_id = project) then
    raise exception 'The analysis must cover every step exactly once.';
  end if;
  for item in
    select * from jsonb_to_recordset(results) as r(
      iteration_id uuid, model text, rubric_version text,
      ai_correctness_addressed boolean, ai_correctness_evidence text,
      verification_addressed boolean, verification_evidence text,
      changes_addressed boolean, changes_evidence text,
      explanation text, uncertainty text, flags jsonb)
  loop
    insert into public.analysis_results (
      project_id, final_version_id, iteration_id, analysis_version, model, rubric_version,
      ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence,
      changes_addressed, changes_evidence, explanation, uncertainty)
    values (
      project, final_id, item.iteration_id, run, item.model, item.rubric_version,
      item.ai_correctness_addressed, item.ai_correctness_evidence, item.verification_addressed, item.verification_evidence,
      item.changes_addressed, item.changes_evidence, item.explanation, item.uncertainty)
    returning id into result_id;
    for flagged in
      select * from jsonb_to_recordset(coalesce(item.flags, '[]'::jsonb)) as f(kind text, evidence text, explanation text)
    loop
      select f.review_state, f.reviewed_by, f.reviewed_at into earlier_state, earlier_by, earlier_at
        from public.flags f join public.analysis_results a on a.id = f.analysis_result_id
        where a.project_id = project and a.iteration_id = item.iteration_id
          and a.analysis_version <> run and f.kind = flagged.kind
        order by a.created_at desc limit 1;
      keep := coalesce(earlier_state <> 'open', false);
      insert into public.flags (analysis_result_id, kind, evidence, explanation, review_state, reviewed_by, reviewed_at)
        values (result_id, flagged.kind, flagged.evidence, flagged.explanation,
          case when keep then earlier_state else 'open' end,
          case when keep then earlier_by end,
          case when keep then earlier_at end);
    end loop;
  end loop;
  update public.projects p set
    analysis_status = 'completed',
    analysis_error = null,
    analysis_finished_at = now()
    where p.id = project;
end;
$$;

create function public.fail_analysis(project uuid, run text, reason text)
returns void
language sql set search_path = '' as $$
  update public.projects p set
    analysis_status = 'failed',
    analysis_error = coalesce(nullif(btrim(reason), ''), 'The reflection check failed.'),
    analysis_finished_at = now()
    where p.id = project and p.analysis_status = 'running' and p.analysis_version = run;
$$;

revoke all on function public.start_analysis(uuid, boolean, integer), public.complete_analysis(uuid, text, jsonb),
  public.fail_analysis(uuid, text, text) from public, anon, authenticated;
grant execute on function public.start_analysis(uuid, boolean, integer), public.complete_analysis(uuid, text, jsonb),
  public.fail_analysis(uuid, text, text) to service_role;

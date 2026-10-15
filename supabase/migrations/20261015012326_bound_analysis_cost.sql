revoke all on table public.analysis_attempts from anon, authenticated;

drop function public.start_analysis(uuid, boolean, integer);
drop function public.complete_analysis(uuid, text, jsonb);
drop function public.fail_analysis(uuid, text, text);

create function public.start_analysis(
  project uuid, restart boolean, stale_after integer,
  max_steps integer, max_step_chars integer, step_overhead integer,
  daily_tokens integer, max_running integer, max_attempts integer)
returns jsonb
language plpgsql set search_path = '' as $$
declare
  submitted public.projects;
  run text;
  steps integer;
  longest integer;
  estimate integer;
  refusal text;
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
  if (select count(*) from public.analysis_attempts a
      where a.project_id = project and a.started_at > now() - interval '24 hours') >= max_attempts then
    return jsonb_build_object('refused',
      'This submission was checked ' || max_attempts || ' times in the last 24 hours, which is the limit. Try again tomorrow.');
  end if;
  select 'analysis-v' || (count(distinct a.analysis_version) + 1) into run
    from public.analysis_results a where a.project_id = project;
  select count(*), coalesce(max(s.size), 0), coalesce(sum(ceil(s.size / 3.0)), 0) + count(*) * step_overhead
    into steps, longest, estimate
    from (select length(i.prompt) + length(i.raw_answer) + coalesce(length(i.critique), 0) as size
      from public.iterations i where i.project_id = project) s;

  perform pg_advisory_xact_lock(hashtext('public.analysis_attempts'));
  update public.analysis_attempts a set used_tokens = a.reserved_tokens, finished_at = now()
    where a.project_id = project and a.finished_at is null;
  refusal := case
    when steps > max_steps then
      'This log has ' || steps || ' steps, over the limit of ' || max_steps || ' for the check. A grader needs to read it.'
    when longest > max_step_chars then
      'A step is longer than the limit of ' || max_step_chars || ' characters for the check. A grader needs to read it.'
    when (select count(*) from public.analysis_attempts a
        where a.finished_at is null and a.started_at > now() - make_interval(secs => stale_after)) >= max_running then
      'Too many checks are running. Try again in a few minutes.'
    when (select coalesce(sum(coalesce(a.used_tokens, a.reserved_tokens)), 0) from public.analysis_attempts a
        where a.started_at > now() - interval '24 hours') + estimate > daily_tokens then
      'The daily limit for checks is used up. Try again tomorrow.'
  end;
  if refusal is not null then
    update public.projects p set
      analysis_status = 'failed',
      analysis_version = run,
      analysis_error = refusal,
      analysis_started_at = now(),
      analysis_finished_at = now()
      where p.id = project;
    return jsonb_build_object('refused', refusal);
  end if;

  insert into public.analysis_attempts (project_id, reserved_tokens) values (project, estimate);
  update public.projects p set
    analysis_status = 'running',
    analysis_version = run,
    analysis_error = null,
    analysis_started_at = now(),
    analysis_finished_at = null
    where p.id = project;
  return jsonb_build_object('version', run);
end;
$$;

create function public.complete_analysis(project uuid, run text, results jsonb, tokens integer default null)
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
  update public.analysis_attempts a set used_tokens = coalesce(tokens, a.reserved_tokens), finished_at = now()
    where a.project_id = project and a.finished_at is null;
end;
$$;

create function public.fail_analysis(project uuid, run text, reason text, tokens integer default null)
returns void
language plpgsql set search_path = '' as $$
begin
  update public.projects p set
    analysis_status = 'failed',
    analysis_error = coalesce(nullif(btrim(reason), ''), 'The reflection check failed.'),
    analysis_finished_at = now()
    where p.id = project and p.analysis_status = 'running' and p.analysis_version = run;
  if found then
    update public.analysis_attempts a set used_tokens = coalesce(tokens, a.reserved_tokens), finished_at = now()
      where a.project_id = project and a.finished_at is null;
  end if;
end;
$$;

revoke all on function
  public.start_analysis(uuid, boolean, integer, integer, integer, integer, integer, integer, integer),
  public.complete_analysis(uuid, text, jsonb, integer),
  public.fail_analysis(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function
  public.start_analysis(uuid, boolean, integer, integer, integer, integer, integer, integer, integer),
  public.complete_analysis(uuid, text, jsonb, integer),
  public.fail_analysis(uuid, text, text, integer)
  to service_role;

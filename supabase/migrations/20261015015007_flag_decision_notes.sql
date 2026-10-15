ALTER TABLE "flag_reviews" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "flags" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "flag_reviews" ADD CONSTRAINT "flag_reviews_note_check" CHECK ("flag_reviews"."note" is null or btrim("flag_reviews"."note") <> '');--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_review_note_check" CHECK ("flags"."review_note" is null or (btrim("flags"."review_note") <> '' and char_length("flags"."review_note") <= 2000 and "flags"."review_state" <> 'open'));
--> statement-breakpoint
grant update (review_note) on public.flags to authenticated;

create or replace function public.record_flag_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.reviewed_by is not null) or (tg_op = 'UPDATE' and
    (new.review_state, new.reviewed_by, new.reviewed_at, new.review_note)
      is distinct from (old.review_state, old.reviewed_by, old.reviewed_at, old.review_note)) then
    if new.reviewed_by is null then
      raise check_violation using message = 'Review changes require a reviewer and time, including reopening';
    end if;
    insert into public.flag_reviews (flag_id, review_state, reviewer_id, reviewed_at, note)
      values (new.id, new.review_state, new.reviewed_by, new.reviewed_at, new.review_note);
  end if;
  return new;
end;
$$;

create function public.review_flag(flag uuid, decision public.flag_review_state, note text default null)
returns uuid
language plpgsql set search_path = '' as $$
declare
  target public.flags;
  kept text := case when decision = 'open' then null else nullif(btrim(note), '') end;
begin
  if char_length(kept) > 2000 then
    raise exception 'Keep the note to 2,000 characters or fewer.';
  end if;
  select f.* into target from public.flags f where f.id = flag for update;
  if not found then
    return null;
  end if;
  if target.review_state = decision and target.review_note is not distinct from kept then
    return target.id;
  end if;
  update public.flags f set
    review_state = decision,
    review_note = kept,
    reviewed_by = auth.uid(),
    reviewed_at = now()
    where f.id = flag;
  return flag;
end;
$$;

revoke all on function public.review_flag(uuid, public.flag_review_state, text) from public, anon;
grant execute on function public.review_flag(uuid, public.flag_review_state, text) to authenticated;

create or replace function public.complete_analysis(project uuid, run text, results jsonb, tokens integer default null)
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
  earlier_note text;
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
      select f.review_state, f.reviewed_by, f.reviewed_at, f.review_note
        into earlier_state, earlier_by, earlier_at, earlier_note
        from public.flags f join public.analysis_results a on a.id = f.analysis_result_id
        where a.project_id = project and a.iteration_id = item.iteration_id
          and a.analysis_version <> run and f.kind = flagged.kind
        order by a.created_at desc limit 1;
      keep := coalesce(earlier_state <> 'open', false);
      insert into public.flags (analysis_result_id, kind, evidence, explanation, review_state, reviewed_by, reviewed_at, review_note)
        values (result_id, flagged.kind, flagged.evidence, flagged.explanation,
          case when keep then earlier_state else 'open' end,
          case when keep then earlier_by end,
          case when keep then earlier_at end,
          case when keep then earlier_note end);
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

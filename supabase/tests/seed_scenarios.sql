begin;
select plan(33);

create temp table seed_words as
select 'answer' as kind, i.project_id, i.step_number, t.ord, t.m[1] as word
from public.iterations i
cross join lateral regexp_matches(lower(i.raw_answer), '[a-z0-9]+', 'g') with ordinality as t(m, ord)
union all
select 'final', f.project_id, 0, t.ord, t.m[1]
from public.final_versions f
cross join lateral regexp_matches(lower(f.extracted_text), '[a-z0-9]+', 'g') with ordinality as t(m, ord)
where f.is_current;

create temp table seed_grams as
select kind, project_id, step_number, ord, gram
from (
  select kind, project_id, step_number, ord,
    string_agg(word, ' ') over w as gram,
    count(*) over w as size
  from seed_words
  window w as (partition by kind, project_id, step_number order by ord rows between current row and 5 following)
) windows
where size = 6;

create temp table seed_matches as
select hit.project_id, hit.ord + offsets.k as ord, min(hit.step_number) as step_number
from (
  select f.project_id, f.ord, min(a.step_number) as step_number
  from seed_grams f
  join seed_grams a on a.kind = 'answer' and a.project_id = f.project_id and a.gram = f.gram
  where f.kind = 'final'
  group by f.project_id, f.ord
) hit
cross join generate_series(0, 5) as offsets(k)
group by hit.project_id, hit.ord + offsets.k;

create function pg_temp.words(project uuid) returns text language sql as $$
  select (select count(*) from seed_words where kind = 'final' and project_id = project) || ' words, '
    || (select count(*) from seed_matches where project_id = project) || ' matched, steps '
    || coalesce((select string_agg(step_number || ':' || n, ',' order by step_number)
      from (select step_number, count(*) as n from seed_matches where project_id = project group by step_number) s), 'none');
$$;

select is(pg_temp.words('40000000-0000-0000-0000-000000000002'), '242 words, 110 matched, steps 3:13,5:49,8:39,9:9', 'Nine-step essay counts each overlapping word once');
select is(pg_temp.words('40000000-0000-0000-0000-000000000003'), '68 words, 28 matched, steps 1:14,2:14', 'Combined answer is credited to the earlier steps');
select is(pg_temp.words('40000000-0000-0000-0000-000000000004'), '58 words, 15 matched, steps 1:15', 'Short specific critique essay matches one sentence');
select is(pg_temp.words('40000000-0000-0000-0000-000000000005'), '31 words, 31 matched, steps 1:31', 'Repeated answer with changed case and punctuation matches fully');
select is(pg_temp.words('40000000-0000-0000-0000-000000000006'), '46 words, 0 matched, steps none', 'Unmatched essay has no matches');
select is(pg_temp.words('40000000-0000-0000-0000-000000000008'), '62 words, 7 matched, steps 3:7', 'Quoted AI wording counts as a match');
select is((select count(*)::integer from seed_matches where project_id = '40000000-0000-0000-0000-000000000003' and step_number = 3), 0, 'Overlapping answers give the later step no matched words');

select is((select count(*)::integer from public.profiles where role = 'instructor'), 1, 'One instructor');
select is((select count(*)::integer from public.enrolments where student_id is not null), 7, 'Seven enrolled students');
select is((select count(*)::integer from public.assignments where lane = 'lane_1'), 1, 'One Lane 1 assignment');
select is((select count(*)::integer from public.assignments where lane = 'lane_2'), 2, 'Two Lane 2 assignments');
select is((select count(*)::integer from public.projects p join public.assignments a on a.id = p.assignment_id where a.lane = 'lane_1'), 0, 'Lane 1 has no AI projects');
select is((select count(*)::integer from public.iterations where project_id = '40000000-0000-0000-0000-000000000002'), 9, 'Nine-step example');
select is((select string_agg(step_number::text, ',' order by step_number) from public.iterations where project_id = '40000000-0000-0000-0000-000000000002' and source_conversation_id = 'a1b2c3d4-john-essay-2'), '1,2,3,4', 'Imported conversation keeps its step order');
select is((select count(*)::integer from public.projects p where p.status = 'draft' and not exists (select 1 from public.iterations i where i.project_id = p.id) and not exists (select 1 from public.final_versions f where f.project_id = p.id)), 1, 'One untouched draft');
select is((select count(*)::integer from public.iterations where project_id = '40000000-0000-0000-0000-000000000001' and critique is null), 2, 'In-progress draft has imported steps waiting for critiques');
select is((select count(*)::integer from public.iterations where project_id = '40000000-0000-0000-0000-000000000001' and critique is not null), 3, 'In-progress draft has critiqued steps');
select is((select count(*)::integer from public.iterations where student_marked_ai_error), 7, 'Student-marked errors');
select is((select critique from public.iterations where id = '50000000-0000-0000-0002-000000000006'), 'Looks good.', 'Thin critique');
select is((select length(critique) < 70 and critique ~ '[0-9]{4}' from public.iterations where id = '50000000-0000-0000-0004-000000000002'), true, 'Short specific critique');

select is((select string_agg(status::text || ':' || n, ',' order by status) from (select status, count(*) as n from public.projects group by status) s), 'draft:2,submitted:6', 'Project statuses');
select is((select string_agg(analysis_status::text || ':' || n, ',' order by analysis_status) from (select analysis_status, count(*) as n from public.projects where status = 'submitted' group by analysis_status) s), 'pending:1,running:1,completed:3,failed:1', 'Submitted analysis states');
select is((select analysis_error from public.projects where id = '40000000-0000-0000-0000-000000000005'), 'Reflection check timed out after 60 seconds.', 'Failed analysis keeps its error');
select is((select count(*)::integer from public.analysis_results r join public.projects p on p.id = r.project_id where p.analysis_status <> 'completed'), 0, 'Only completed analysis has results');
select is((select count(*)::integer from public.analysis_results r where not exists (select 1 from public.final_versions f where f.id = r.final_version_id and f.is_current)), 0, 'Results point at the current final version');
select is((select string_agg(project_id::text || ':' || n, ',' order by project_id) from (select project_id, count(*) as n from public.analysis_results group by project_id) s), '40000000-0000-0000-0000-000000000002:9,40000000-0000-0000-0000-000000000003:4,40000000-0000-0000-0000-000000000004:3', 'One result per analysed step');
select is((select string_agg(to_char(avg, 'FM0.00'), ',' order by project_id) from (select project_id, avg(ai_correctness_addressed::integer + verification_addressed::integer + changes_addressed::integer) as avg from public.analysis_results group by project_id) s), '2.00,1.75,2.67', 'Average questions answered');

select is((select string_agg(review_state::text || ':' || n, ',' order by review_state) from (select review_state, count(*) as n from public.flags group by review_state) s), 'open:2,dismissed:1,added_to_feedback:1', 'Flag review counts');
select is((select string_agg(project_id::text || ':' || n, ',' order by project_id) from (select r.project_id, count(*) as n from public.flags f join public.analysis_results r on r.id = f.analysis_result_id group by r.project_id) s), '40000000-0000-0000-0000-000000000002:2,40000000-0000-0000-0000-000000000003:1,40000000-0000-0000-0000-000000000004:1', 'Flags per submission');
select is((select count(*)::integer from public.flags where (review_state = 'open') <> (reviewed_by is null)), 0, 'Only reviewed flags have a reviewer');
select is((select count(*)::integer from public.flag_reviews), 2, 'Decisions are in the review history');
select is((select count(*)::integer from public.final_versions where is_current), 6, 'One current final per written essay');
select is((select count(*)::integer from public.final_versions where match_results is not null), 0, 'Matching output is left to the matcher');

select * from finish();
rollback;

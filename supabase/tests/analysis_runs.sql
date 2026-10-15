begin;
select no_plan();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'teacher@runs.test', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'student@runs.test', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'other@runs.test', now());
update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'RUNS', 'Runs');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2', 'student@runs.test'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3', 'other@runs.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Submitted', 'lane_2'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f1', 'Draft', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3');
insert into public.iterations (id, project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 2, 'ChatGPT', 'Second', 'Two', 'Checked two.'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b2', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000b3', 1, 'ChatGPT', 'First', 'One', 'Checked one.');
insert into public.final_versions (id, project_id, version_number, extracted_text, submitted_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 1, 'Final text', now()),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000b3', 1, 'Final text', now());
insert into public.final_versions (id, project_id, version_number, extracted_text) values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 1, 'Final text');
update public.projects set status = 'submitted', submitted_at = now()
  where id in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b3');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select throws_ok($$select public.start_analysis('00000000-0000-0000-0000-0000000000b1', true, 600)$$, '42501', null, 'An instructor cannot start a run through the database API');
select throws_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', '[]')$$, '42501', null, 'An instructor cannot write results through the database API');
select throws_ok($$select public.fail_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', 'Nope')$$, '42501', null, 'An instructor cannot fail a run through the database API');
reset role;
set local role anon;
select throws_ok($$select public.start_analysis('00000000-0000-0000-0000-0000000000b1', true, 600)$$, '42501', null, 'Signed-out visitors cannot start a run');
reset role;

set local role service_role;
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b2', true, 600), null, 'A draft is never analysed');
select is((select analysis_status::text from public.projects where id = '00000000-0000-0000-0000-0000000000b2'), 'pending', 'A refused run leaves the draft pending');

select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', false, 600), 'analysis-v1', 'The first run of a submission gets the first version');
select is((select analysis_status::text || ' ' || analysis_version from public.projects where id = '00000000-0000-0000-0000-0000000000b1'), 'running analysis-v1', 'The project records the running version');
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', false, 600), null, 'A duplicate submit does not start a second run');
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', true, 600), null, 'A re-analysis request while a run is live does not start a second run');

select throws_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v9', '[]')$$, 'P0001', 'This analysis run is no longer the current one.', 'A run that is not the current one cannot save results');
select throws_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', '[{"iteration_id":"00000000-0000-0000-0000-0000000000c1"}]')$$, 'P0001', 'The analysis must cover every step exactly once.', 'A run that skips a step cannot save results');
select throws_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', (select jsonb_build_array(r, r) from (select '{"iteration_id":"00000000-0000-0000-0000-0000000000c1","model":"m","rubric_version":"r1","ai_correctness_addressed":true,"ai_correctness_evidence":"Checked","verification_addressed":false,"verification_evidence":"","changes_addressed":false,"changes_evidence":"","explanation":"E","uncertainty":"U","flags":[]}'::jsonb as r) x))$$, '23505', null, 'A run that repeats a step cannot save results');
select is((select count(*)::integer from public.analysis_results where project_id = '00000000-0000-0000-0000-0000000000b1'), 0, 'Rejected results leave nothing behind');

select lives_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', '[
  {"iteration_id":"00000000-0000-0000-0000-0000000000c1","model":"m","rubric_version":"r1",
   "ai_correctness_addressed":true,"ai_correctness_evidence":"Checked","verification_addressed":false,"verification_evidence":"",
   "changes_addressed":false,"changes_evidence":"","explanation":"E","uncertainty":"U",
   "flags":[{"kind":"blind_acceptance","evidence":"Checked one.","explanation":"No check"},{"kind":"low_effort_reflection","evidence":"Checked one.","explanation":"Thin"}]},
  {"iteration_id":"00000000-0000-0000-0000-0000000000c2","model":"m","rubric_version":"r1",
   "ai_correctness_addressed":true,"ai_correctness_evidence":"Checked","verification_addressed":true,"verification_evidence":"Checked",
   "changes_addressed":true,"changes_evidence":"Checked","explanation":"E","uncertainty":"U","flags":[]}]')$$, 'A current run saves every step with its flags together');
select is((select analysis_status::text from public.projects where id = '00000000-0000-0000-0000-0000000000b1'), 'completed', 'The project is completed');
select is((select count(*)::integer from public.analysis_results where project_id = '00000000-0000-0000-0000-0000000000b1' and analysis_version = 'analysis-v1' and final_version_id = '00000000-0000-0000-0000-0000000000d1'), 2, 'One result per step is stored against the submitted final version');
select is((select count(*)::integer from public.flags f join public.analysis_results a on a.id = f.analysis_result_id where a.project_id = '00000000-0000-0000-0000-0000000000b1' and f.review_state = 'open'), 2, 'New flags start open');
select throws_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v1', '[]')$$, 'P0001', 'This analysis run is no longer the current one.', 'A finished run cannot save results twice');
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', false, 600), null, 'A duplicate submit does not re-run a finished check');

reset role;
update public.flags set review_state = 'dismissed', reviewed_by = '00000000-0000-0000-0000-0000000000e1', reviewed_at = '2026-10-12 10:00+00'
  where kind = 'blind_acceptance' and analysis_result_id in (select id from public.analysis_results where project_id = '00000000-0000-0000-0000-0000000000b1');
set local role service_role;

select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', true, 600), 'analysis-v2', 'Re-analysis starts a new version');
select is((select count(*)::integer from public.analysis_results where project_id = '00000000-0000-0000-0000-0000000000b1' and analysis_version = 'analysis-v1'), 2, 'The earlier results stay while the new run is going');
select lives_ok($$select public.fail_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v2', 'The reflection check timed out.')$$, 'A run can be marked failed');
select is((select analysis_status::text || ' ' || analysis_error from public.projects where id = '00000000-0000-0000-0000-0000000000b1'), 'failed The reflection check timed out.', 'The failure and its reason are recorded');
select is((select count(*)::integer from public.analysis_results where project_id = '00000000-0000-0000-0000-0000000000b1' and analysis_version = 'analysis-v1'), 2, 'A failed re-analysis keeps the earlier results');

select is(public.start_analysis('00000000-0000-0000-0000-0000000000b1', true, 600), 'analysis-v2', 'A failed run can be tried again under the next unused version');
select lives_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v2', '[
  {"iteration_id":"00000000-0000-0000-0000-0000000000c1","model":"m2","rubric_version":"r2",
   "ai_correctness_addressed":true,"ai_correctness_evidence":"Checked","verification_addressed":false,"verification_evidence":"",
   "changes_addressed":false,"changes_evidence":"","explanation":"E","uncertainty":"U",
   "flags":[{"kind":"blind_acceptance","evidence":"Checked one.","explanation":"Still no check"},{"kind":"reads_like_ai","evidence":"Checked one.","explanation":"Polished"}]},
  {"iteration_id":"00000000-0000-0000-0000-0000000000c2","model":"m2","rubric_version":"r2",
   "ai_correctness_addressed":true,"ai_correctness_evidence":"Checked","verification_addressed":true,"verification_evidence":"Checked",
   "changes_addressed":true,"changes_evidence":"Checked","explanation":"E","uncertainty":"U","flags":[]}]')$$, 'A successful re-analysis saves the new set');
select is((select string_agg(f.kind || ':' || f.review_state::text, ', ' order by f.kind) from public.flags f join public.analysis_results a on a.id = f.analysis_result_id where a.analysis_version = 'analysis-v2' and a.project_id = '00000000-0000-0000-0000-0000000000b1'), 'blind_acceptance:dismissed, reads_like_ai:open', 'A flag on the same step and kind keeps its earlier decision and a new one starts open');
select is((select reviewed_by from public.flags f join public.analysis_results a on a.id = f.analysis_result_id where a.project_id = '00000000-0000-0000-0000-0000000000b1' and a.analysis_version = 'analysis-v2' and f.kind = 'blind_acceptance'), '00000000-0000-0000-0000-0000000000e1'::uuid, 'The carried decision keeps its reviewer');
select is((select count(*)::integer from public.flags f join public.analysis_results a on a.id = f.analysis_result_id where a.project_id = '00000000-0000-0000-0000-0000000000b1' and a.analysis_version = 'analysis-v1' and f.review_state = 'dismissed'), 1, 'The earlier decision stays on the earlier result');

select is(public.start_analysis('00000000-0000-0000-0000-0000000000b3', false, 600), 'analysis-v1', 'A second submission is claimed on its own');
reset role;
update public.projects set analysis_started_at = now() - interval '20 minutes' where id = '00000000-0000-0000-0000-0000000000b3';
set local role service_role;
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b3', false, 3600), null, 'A run inside its lease is left alone');
select is(public.start_analysis('00000000-0000-0000-0000-0000000000b3', false, 600), 'analysis-v1', 'A run past its lease is replaced');
select lives_ok($$select public.fail_analysis('00000000-0000-0000-0000-0000000000b3', 'analysis-v1', '   ')$$, 'A blank reason still records a failure');
select is((select analysis_error from public.projects where id = '00000000-0000-0000-0000-0000000000b3'), 'The reflection check failed.', 'A blank reason falls back to a plain message');
select lives_ok($$select public.fail_analysis('00000000-0000-0000-0000-0000000000b3', 'analysis-v1', 'Late')$$, 'A late failure report is ignored');
select is((select analysis_error from public.projects where id = '00000000-0000-0000-0000-0000000000b3'), 'The reflection check failed.', 'A late failure report does not overwrite the recorded one');

reset role;
select * from finish();
rollback;

begin;
select no_plan();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'teacher@review.test', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'student@review.test', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'other@review.test', now());
update public.profiles set role = 'instructor'
  where id in ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e3');
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'REV', 'Review');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2', 'student@review.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Essay', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2');
insert into public.iterations (id, project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 1, 'ChatGPT', 'First', 'One', 'Fine.');
insert into public.final_versions (id, project_id, version_number, extracted_text, submitted_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 1, 'Final text', now());
update public.projects set status = 'submitted', submitted_at = now(), analysis_status = 'running', analysis_version = 'analysis-v1', analysis_started_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.analysis_results (id, project_id, final_version_id, iteration_id, analysis_version, model, rubric_version,
  ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence,
  changes_addressed, changes_evidence, explanation, uncertainty) values
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1',
   'analysis-v1', 'm', 'r1', true, 'Fine.', false, '', false, '', 'Explanation', 'Uncertainty');
insert into public.flags (id, analysis_result_id, kind, evidence, explanation) values
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000061', 'blind_acceptance', 'Fine.', 'No check');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', 'Mine'), null, 'A student cannot review a flag');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e3', true);
select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', 'Theirs'), null, 'An instructor of another course cannot review the flag');
reset role;
select is((select review_state::text from public.flags where id = '00000000-0000-0000-0000-000000000071'), 'open', 'Refused reviews leave the flag open');
select is((select count(*)::integer from public.flag_reviews where flag_id = '00000000-0000-0000-0000-000000000071'), 0, 'Refused reviews leave no history');

set local role anon;
select throws_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed')$$, '42501', null, 'Signed-out visitors cannot review a flag');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'open', 'Ignored'), '00000000-0000-0000-0000-000000000071'::uuid, 'Reopening a flag that is already open succeeds');
select is((select count(*)::integer from public.flag_reviews where true), 0, 'Reopening an open flag adds no history');

select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', '  Not a concern.  '), '00000000-0000-0000-0000-000000000071'::uuid, 'The course instructor can dismiss the flag');
select is((select review_state::text || ' ' || review_note || ' ' || (reviewed_by = '00000000-0000-0000-0000-0000000000e1')::text from public.flags where id = '00000000-0000-0000-0000-000000000071'), 'dismissed Not a concern. true', 'The decision keeps the trimmed note and the reviewer');
select is((select count(*)::integer from public.flag_reviews where true), 1, 'The decision is in the history');

select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', 'Not a concern.'), '00000000-0000-0000-0000-000000000071'::uuid, 'A repeated click succeeds');
select is((select count(*)::integer from public.flag_reviews where true), 1, 'A repeated click adds no history');

select lives_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'added_to_feedback', null)$$, 'A corrected decision is accepted');
select is((select review_state::text || ' ' || coalesce(review_note, 'none') from public.flags where id = '00000000-0000-0000-0000-000000000071'), 'added_to_feedback none', 'A corrected decision replaces the state and clears the old note');
select is((select string_agg(review_state::text || ':' || coalesce(note, 'none'), ', ' order by review_state::text) from public.flag_reviews where flag_id = '00000000-0000-0000-0000-000000000071'), 'added_to_feedback:none, dismissed:Not a concern.', 'The earlier decision stays in the history');

select lives_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'added_to_feedback', 'Say more about the check.')$$, 'A note can change on its own');
select is((select count(*)::integer from public.flag_reviews where true), 3, 'Changing only the note is recorded');

select lives_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'open')$$, 'Undo is accepted');
select is((select review_state::text || ' ' || coalesce(review_note, 'none') from public.flags where id = '00000000-0000-0000-0000-000000000071'), 'open none', 'Undo reopens the flag and drops the note');
select is((select count(*)::integer from public.flag_reviews where true), 4, 'Reopening is in the history');
select throws_ok($$update public.flags set review_note = 'No decision' where id = '00000000-0000-0000-0000-000000000071'$$, '23514', null, 'A direct write cannot leave a note on an open flag');

select throws_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', repeat('x', 2001))$$, 'P0001', 'Keep the note to 2,000 characters or fewer.', 'A note over the limit is refused');
select is(public.review_flag('00000000-0000-0000-0000-000000000071', 'dismissed', '   '), '00000000-0000-0000-0000-000000000071'::uuid, 'A blank note is a decision without a note');
select is((select coalesce(review_note, 'none') from public.flags where id = '00000000-0000-0000-0000-000000000071'), 'none', 'A blank note is not stored');
select is(public.review_flag('00000000-0000-0000-0000-000000000099', 'dismissed'), null, 'An unknown flag changes nothing');
reset role;

update public.projects set analysis_status = 'running', analysis_version = 'analysis-v2', analysis_started_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select lives_ok($$select public.review_flag('00000000-0000-0000-0000-000000000071', 'added_to_feedback', 'Keep for the report.')$$, 'The decision to carry is accepted');
reset role;
set local role service_role;
select lives_ok($$select public.complete_analysis('00000000-0000-0000-0000-0000000000b1', 'analysis-v2', '[{"iteration_id":"00000000-0000-0000-0000-0000000000c1","model":"m","rubric_version":"r1","ai_correctness_addressed":true,"ai_correctness_evidence":"Fine.","verification_addressed":false,"verification_evidence":"","changes_addressed":false,"changes_evidence":"","explanation":"Again","uncertainty":"Still","flags":[{"kind":"blind_acceptance","evidence":"Fine.","explanation":"Still no check"}]}]')$$, 'A re-analysis saves its flags');
select is((select f.review_state::text || ' ' || f.review_note from public.flags f join public.analysis_results a on a.id = f.analysis_result_id where a.analysis_version = 'analysis-v2'), 'added_to_feedback Keep for the report.', 'A flag with the same step and kind keeps its decision and note');
select is((select string_agg(fr.note, ',') from public.flag_reviews fr join public.flags f on f.id = fr.flag_id join public.analysis_results a on a.id = f.analysis_result_id where a.analysis_version = 'analysis-v2'), 'Keep for the report.', 'The carried decision starts the new flag history with its note');
reset role;

select * from finish();
rollback;

begin;
select plan(16);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'teacher@submit.test', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'student@submit.test', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'other@submit.test', now());
update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'SUBMIT', 'Submit');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2', 'student@submit.test'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3', 'other@submit.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Complete', 'lane_2'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f1', 'No steps', 'lane_2'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000f1', 'No critique', 'lane_2'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000f1', 'No final', 'lane_2'),
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000f1', 'Blank final', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3');
insert into public.iterations (id, project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b3', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b3', 2, 'ChatGPT', 'Second', 'Two', null),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000b4', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000b5', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c6', '00000000-0000-0000-0000-0000000000b6', 1, 'ChatGPT', 'First', 'One', 'Checked one.');
insert into public.final_versions (id, project_id, version_number, extracted_text) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 1, 'Final text'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 1, 'Final text'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000b3', 1, 'Final text'),
  ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000b5', 1, '   '),
  ('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000b6', 1, 'Final text');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);

select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b2')$$, 'P0001', 'Add at least one step before you submit.', 'A log without steps cannot be submitted');
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b3')$$, 'P0001', 'Add a critique to every step before you submit. Still missing: step 2.', 'A step without a critique blocks submission and is named');
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b4')$$, 'P0001', 'Save your final version before you submit.', 'A log without a final version cannot be submitted');
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b5')$$, 'P0001', 'Save your final version before you submit.', 'A blank final version cannot be submitted');
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b6')$$, '42501', null, 'A student cannot submit someone else''s log');
select throws_ok($$update public.projects set status = 'submitted', submitted_at = now() where id = '00000000-0000-0000-0000-0000000000b1'$$, '42501', null, 'A student cannot submit by writing the project row');
select throws_ok($$update public.final_versions set submitted_at = now() where id = '00000000-0000-0000-0000-0000000000d1'$$, '42501', null, 'A student cannot stamp the final version themselves');
select is((select count(*)::integer from public.projects where status = 'submitted'), 0, 'Rejected submits leave every draft open');

select lives_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b1')$$, 'A complete log can be submitted');
select is((select status::text from public.projects where id = '00000000-0000-0000-0000-0000000000b1'), 'submitted', 'The project is submitted');
select is((select f.submitted_at = p.submitted_at from public.projects p join public.final_versions f on f.project_id = p.id where p.id = '00000000-0000-0000-0000-0000000000b1'), true, 'The final version is stamped with the same time');
select is(public.submit_project('00000000-0000-0000-0000-0000000000b1'), (select submitted_at from public.projects where id = '00000000-0000-0000-0000-0000000000b1'), 'Submitting again returns the first time and changes nothing');
with changed as (update public.iterations set critique = 'Changed' where id = '00000000-0000-0000-0000-0000000000c1' returning 1) select is((select count(*)::integer from changed), 0, 'A submitted step can no longer be edited');
select throws_ok($$insert into public.final_versions (project_id, version_number, extracted_text) values ('00000000-0000-0000-0000-0000000000b1', 2, 'Changed')$$, '42501', null, 'A submitted log accepts no new final version');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b6')$$, '42501', null, 'An instructor cannot submit a student log');

reset role;
set local role anon;
select throws_ok($$select public.submit_project('00000000-0000-0000-0000-0000000000b6')$$, '42501', null, 'Signed-out visitors cannot submit');

select * from finish();
rollback;

begin;
select plan(9);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'teacher@remove.test', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'student@remove.test', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'other@remove.test', now());
update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'REMOVE', 'Remove');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2', 'student@remove.test'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3', 'other@remove.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Essay', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3');
insert into public.iterations (id, project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 1, 'ChatGPT', 'First', 'One', 'Checked one.'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 2, 'ChatGPT', 'Second', 'Two', 'Checked two.'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b1', 3, 'ChatGPT', 'Third', 'Three', null),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000b1', 4, 'ChatGPT', 'Fourth', 'Four', null),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000b2', 1, 'ChatGPT', 'Theirs', 'Answer', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);

select lives_ok($$select public.remove_step('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2')$$, 'A student can remove a step from their draft');
select is((select string_agg(prompt || ':' || step_number, ',' order by step_number) from public.iterations where project_id = '00000000-0000-0000-0000-0000000000b1'), 'First:1,Third:2,Fourth:3', 'The steps after it move up so the numbers stay in a row');
select is((select critique from public.iterations where id = '00000000-0000-0000-0000-0000000000c1'), 'Checked one.', 'The steps before it keep their critique');
select is((select step_number from public.iterations where id = '00000000-0000-0000-0000-0000000000c4'), 3, 'A moved step keeps its ID, so notes and provenance stay with it');
select lives_ok($$select public.remove_step('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c4')$$, 'The last step can be removed');
select is((select count(*)::integer from public.iterations where project_id = '00000000-0000-0000-0000-0000000000b1'), 2, 'Removing the last step renumbers nothing');
select throws_ok($$select public.remove_step('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c5')$$, '42501', null, 'A step from another project cannot be removed through this one');
select throws_ok($$select public.remove_step('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c5')$$, '42501', null, 'A student cannot remove steps from someone else''s project');

reset role;
update public.projects set status = 'submitted', submitted_at = now() where id = '00000000-0000-0000-0000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
select throws_ok($$select public.remove_step('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1')$$, '42501', null, 'A submitted project keeps all its steps');

select * from finish();
rollback;

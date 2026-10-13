begin;
select plan(12);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000e1', 'teacher@final.test', now()),
  ('00000000-0000-0000-0000-0000000000e2', 'student@final.test', now()),
  ('00000000-0000-0000-0000-0000000000e3', 'other@final.test', now());
update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-0000000000e1';
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'FINAL', 'Final');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2', 'student@final.test'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3', 'other@final.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Essay', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e3');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);

select is((select version_number from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 0, 'First draft', null)), 1, 'The first save creates version 1');
select is((select version_number from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 1, 'Second draft', 'essay.docx')), 2, 'Saving on top of the current version creates the next one');
select is((select extracted_text || '|' || original_filename from public.final_versions where project_id = '00000000-0000-0000-0000-0000000000b1' and is_current), 'Second draft|essay.docx', 'The newest version is the current one and keeps its filename');
select is((select count(*)::integer from public.final_versions where project_id = '00000000-0000-0000-0000-0000000000b1' and not is_current and extracted_text = 'First draft'), 1, 'The earlier version is kept, no longer current');

select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 1, 'Stale edit', null)$$, '40001', null, 'A save based on an older version is refused');
select is((select extracted_text from public.final_versions where project_id = '00000000-0000-0000-0000-0000000000b1' and is_current), 'Second draft', 'A refused save leaves the current text alone');
select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 0, 'Blind edit', null)$$, '40001', null, 'A save that assumes there is no version is refused once one exists');

select is((select version_number from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 2, '', null)), 3, 'Empty text can be saved in a draft');
select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 3, 'Text', '  ')$$, '23514', null, 'A blank filename is rejected');
select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b2', 0, 'Not mine', null)$$, '42501', null, 'A student cannot save final text on someone else''s project');

reset role;
update public.projects set status = 'submitted', submitted_at = now() where id = '00000000-0000-0000-0000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 3, 'Too late', null)$$, '42501', null, 'A submitted project accepts no new final text');

reset role;
set local role anon;
select throws_ok($$select * from public.save_final_version('00000000-0000-0000-0000-0000000000b1', 3, 'x', null)$$, '42501', null, 'Anonymous clients cannot call save_final_version');

select * from finish();
rollback;

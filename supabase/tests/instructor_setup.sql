begin;
select no_plan();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000001', 'teacher-a@setup.test', now()),
  ('00000000-0000-0000-0000-000000000002', 'teacher-b@setup.test', now()),
  ('00000000-0000-0000-0000-000000000003', 'student@setup.test', now()),
  ('00000000-0000-0000-0000-000000000004', 'unconfirmed@setup.test', null);
update public.profiles set role = 'instructor'
where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok($$insert into public.courses (instructor_id, code, title) values ('00000000-0000-0000-0000-000000000001', 'A', 'Course A')$$, 'Instructor can create a course');
reset role;
update public.courses set id = '00000000-0000-0000-0000-000000000010' where code = 'A';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select throws_ok($$insert into public.courses (instructor_id, code, title) values ('00000000-0000-0000-0000-000000000002', 'B', 'Course B')$$, '42501', null, 'Instructor cannot create a course for someone else');
select throws_ok($$insert into public.courses (instructor_id, code, title) values ('00000000-0000-0000-0000-000000000001', 'A', 'Again')$$, '23505', null, 'Course codes stay unique per instructor');
select lives_ok($$insert into public.assignments (course_id, title, brief, due_at, lane) values ('00000000-0000-0000-0000-000000000010', 'Essay', 'Brief', '2026-11-01 17:00+11', 'lane_2'), ('00000000-0000-0000-0000-000000000010', 'Lab', '', null, 'lane_1')$$, 'Instructor can add assignments to an owned course');
select is(
  (select string_agg(address || ':' || outcome, ',' order by address) from public.enrol_students(
    '00000000-0000-0000-0000-000000000010',
    array[' Student@Setup.test ', 'student@setup.test', 'new@setup.test', 'unconfirmed@setup.test', 'teacher-b@setup.test', 'not-an-email'])),
  'new@setup.test:invited,not-an-email:invalid,student@setup.test:enrolled,teacher-b@setup.test:not_a_student,unconfirmed@setup.test:invited',
  'Enrolment links confirmed students and records pending invitations');
select is(
  (select string_agg(address || ':' || outcome, ',' order by address) from public.enrol_students(
    '00000000-0000-0000-0000-000000000010', array['student@setup.test', 'new@setup.test', 'fresh@setup.test'])),
  'fresh@setup.test:invited,new@setup.test:duplicate,student@setup.test:duplicate',
  'Repeated addresses are reported as duplicates');
select is((select student_id from public.enrolments where email = 'student@setup.test'), '00000000-0000-0000-0000-000000000003'::uuid, 'Existing account is linked to its profile');
select is((select count(*)::integer from public.enrolments where student_id is null), 3, 'Unknown and unconfirmed addresses stay pending');
select is((select count(*)::integer from public.enrolments where email = 'teacher-b@setup.test'), 0, 'Instructor accounts are never enrolled as students');
select throws_ok($$insert into public.enrolments (course_id, student_id, email) values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 'direct@setup.test')$$, '42501', null, 'Enrolments are only written through enrol_students');
select throws_ok($$update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-000000000003'$$, '42501', null, 'Instructor cannot change another profile role');
select lives_ok($$select * from public.enrol_students('00000000-0000-0000-0000-000000000010', array['oops@setup.test'])$$, 'Instructor can invite someone by mistake');
select lives_ok($$delete from public.enrolments where email = 'oops@setup.test'$$, 'Instructor can remove a pending invitation');
select is((select count(*)::integer from public.enrolments where email = 'oops@setup.test'), 0, 'The removed invitation is gone');
reset role;
insert into public.projects (assignment_id, course_id, student_id)
select id, course_id, '00000000-0000-0000-0000-000000000003' from public.assignments where title = 'Essay';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select throws_ok($$delete from public.enrolments where email = 'student@setup.test'$$, '23503', null, 'A student who has started work cannot be removed');
select is((select string_agg(e.email || ':' || e.has_work, ',' order by e.email) from public.enrolments e where e.email in ('student@setup.test', 'new@setup.test')), 'new@setup.test:false,student@setup.test:true', 'The roster shows which students have a project');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select throws_ok($$select * from public.enrol_students('00000000-0000-0000-0000-000000000010', array['other@setup.test'])$$, '42501', null, 'Another instructor cannot enrol into the course');
select throws_ok($$insert into public.assignments (course_id, title, lane) values ('00000000-0000-0000-0000-000000000010', 'Hijack', 'lane_2')$$, '42501', null, 'Another instructor cannot add assignments to the course');
select is((select count(*)::integer from public.enrolments where true), 0, 'Another instructor cannot read the roster');
select lives_ok($$delete from public.enrolments where true$$, 'Another instructor''s delete matches no rows');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select throws_ok($$insert into public.courses (instructor_id, code, title) values ('00000000-0000-0000-0000-000000000003', 'S', 'Mine')$$, '42501', null, 'Student cannot create courses');
select throws_ok($$insert into public.assignments (course_id, title, lane) values ('00000000-0000-0000-0000-000000000010', 'Mine', 'lane_2')$$, '42501', null, 'Student cannot create assignments');
select throws_ok($$select * from public.enrol_students('00000000-0000-0000-0000-000000000010', array['friend@setup.test'])$$, '42501', null, 'Student cannot enrol others');
select is((select string_agg(title || ':' || lane, ',' order by title) from public.assignments where true), 'Essay:lane_2,Lab:lane_1', 'Enrolled student sees the created assignments with their lanes');
select lives_ok($$delete from public.enrolments where true$$, 'A student''s delete matches no rows');
select is((select e.has_work from public.enrolments e where true), false, 'Students never learn whether a project exists through the roster flag');

reset role;
set local role anon;
select throws_ok($$select * from public.enrol_students('00000000-0000-0000-0000-000000000010', array['a@setup.test'])$$, '42501', null, 'Anonymous cannot call enrol_students');

reset role;
select is((select count(*)::integer from public.enrolments where email = 'student@setup.test'), 1, 'Other instructors and students cannot remove anyone from the roster');
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000005', 'new@setup.test', now()),
  ('00000000-0000-0000-0000-000000000006', 'fresh@setup.test', null);
select is((select student_id from public.enrolments where email = 'new@setup.test'), '00000000-0000-0000-0000-000000000005'::uuid, 'Pending invitation is resolved when a confirmed account signs up');
select is((select student_id from public.enrolments where email = 'fresh@setup.test'), null, 'Unconfirmed sign-up cannot claim an invitation');
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-000000000004';
select is((select student_id from public.enrolments where email = 'unconfirmed@setup.test'), '00000000-0000-0000-0000-000000000004'::uuid, 'Confirming the email resolves the invitation');
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-000000000006';
select is((select student_id from public.enrolments where email = 'fresh@setup.test'), '00000000-0000-0000-0000-000000000006'::uuid, 'Later confirmation resolves the invitation');
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-000000000006'), 'student', 'Claimed invitations never grant instructor access');

select * from finish();
rollback;

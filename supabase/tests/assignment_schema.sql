begin;
select plan(50);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003');
insert into public.profiles (id, display_name, role) values
  ('00000000-0000-0000-0000-000000000001', 'Instructor', 'instructor') on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
insert into public.profiles (id, display_name) values
  ('00000000-0000-0000-0000-000000000002', 'Student'),
  ('00000000-0000-0000-0000-000000000003', 'Other student') on conflict (id) do update set display_name = excluded.display_name;
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'INFO399', 'Capstone'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'INFO400', 'Other course');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'student@example.com'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', 'other@example.com'),
  ('00000000-0000-0000-0000-000000000010', null, 'invited@example.com');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'AI allowed', 'lane_2'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'AI restricted', 'lane_1');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003');
insert into public.iterations (id, project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000030', 1, 'ChatGPT', 'Check my evidence', 'The survey supports the claim', 'I checked the survey and softened the claim.'),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000030', 2, 'Claude', 'Check my conclusion', 'Looks consistent', null);
insert into public.final_versions (id, project_id, version_number, extracted_text, original_filename) values
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000030', 1, 'The survey suggests a trend.', 'essay.docx'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000031', 1, 'Other essay.', null);

select is((select role::text from public.profiles where display_name = 'Student'), 'student', 'Profiles default to student');
select is((select count(*)::integer from public.enrolments where student_id is null), 1, 'Pending invitations do not need an auth user');
select throws_ok($$insert into public.assignments (course_id, title, lane) values ('00000000-0000-0000-0000-000000000010', 'Invalid', 'lane_3')$$, '22P02', null, 'Invalid lanes are rejected');
select throws_ok($$update public.projects set status = 'approved'$$, '22P02', null, 'Invalid project statuses are rejected');
select throws_ok($$update public.projects set analysis_status = 'unknown'$$, '22P02', null, 'Invalid analysis statuses are rejected');
select throws_ok($$insert into public.projects (assignment_id, course_id, student_id) values ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002')$$, '23514', null, 'Lane 1 cannot create AI projects');
select throws_ok($$update public.assignments set lane = 'lane_1' where id = '00000000-0000-0000-0000-000000000020'$$, '23514', null, 'Existing AI projects block switching to Lane 1');
select throws_ok($$insert into public.projects (assignment_id, course_id, student_id) values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002')$$, '23505', null, 'One project per student and assignment');
select throws_ok($$insert into public.projects (assignment_id, course_id, student_id) values ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001')$$, '23503', null, 'A student must be enrolled to own a project');
select throws_ok($$update public.projects set course_id = '00000000-0000-0000-0000-000000000011'$$, '23503', null, 'Projects cannot cross assignment or enrolment courses');
select throws_ok($$delete from public.enrolments where student_id = '00000000-0000-0000-0000-000000000002'$$, '23503', null, 'Enrolments with projects cannot be deleted');
select throws_ok($$update public.iterations set step_number = 1 where id = '00000000-0000-0000-0000-000000000041'$$, '23505', null, 'Duplicate step numbers are rejected');
select throws_ok($$update public.iterations set step_number = 0$$, '23514', null, 'Step numbers must be positive');
select throws_ok($$update public.iterations set id = gen_random_uuid()$$, '23514', null, 'Step IDs remain stable');
select throws_ok($$update public.iterations set project_id = '00000000-0000-0000-0000-000000000031'$$, '23514', null, 'Steps cannot move between projects');
set constraints iterations_project_id_step_number_key deferred;
update public.iterations set step_number = 3 - step_number;
set constraints iterations_project_id_step_number_key immediate;
select is((select step_number from public.iterations where id = '00000000-0000-0000-0000-000000000040'), 2, 'Reordering keeps the same step IDs');
select throws_ok($$update public.iterations set critique = '   '$$, '23514', null, 'Saved critiques cannot be blank');
select throws_ok($$update public.iterations set student_marked_ai_error = true$$, '23514', null, 'Reported errors require student evidence');
select lives_ok($$update public.iterations set student_marked_ai_error = true, ai_error_evidence = 'I checked the original table; the claimed number is wrong.' where id = '00000000-0000-0000-0000-000000000040'$$, 'Student error evidence can be saved');
select throws_ok($$update public.iterations set import_source = 'public_link'$$, '23514', null, 'Link imports require URL and import time');
select lives_ok($$update public.iterations set import_source = 'public_link', source_url = 'https://chatgpt.com/share/example', source_conversation_id = 'example', source_step_id = id::text, imported_at = now()$$, 'Import provenance can be saved');
select throws_ok($$update public.iterations set ai_tool = 'ChatGPT', source_step_id = '00000000-0000-0000-0000-000000000040' where id = '00000000-0000-0000-0000-000000000041'$$, '23505', null, 'The same imported source step cannot be saved twice');
select throws_ok($$insert into public.final_versions (project_id, version_number) values ('00000000-0000-0000-0000-000000000030', 2)$$, '23505', null, 'Only one final version can be current');
select lives_ok($$insert into public.final_versions (project_id, version_number, extracted_text, is_current) values ('00000000-0000-0000-0000-000000000030', 2, 'Archived text.', false)$$, 'Historical final text can coexist with the current version');
update public.final_versions set is_current = false where project_id = '00000000-0000-0000-0000-000000000030';
update public.final_versions set is_current = true where project_id = '00000000-0000-0000-0000-000000000030' and version_number = 2;
select is((select version_number from public.final_versions where project_id = '00000000-0000-0000-0000-000000000030' and is_current), 2, 'Replacing the current final retains the old version');
select throws_ok($$update public.final_versions set match_results = '{}'::jsonb$$, '23514', null, 'Matching results require an algorithm version');
select throws_ok($$update public.final_versions set extracted_text = 'Changed essay.'$$, '23514', null, 'Saved final text remains tied to its version ID');
select throws_ok($$update public.projects set status = 'submitted'$$, '23514', null, 'Submission requires a timestamp');
select throws_ok($$update public.projects set analysis_status = 'running'$$, '23514', null, 'Drafts cannot start analysis');
select lives_ok($$update public.projects set status = 'submitted', submitted_at = now(), analysis_status = 'running', analysis_version = 'run-1', analysis_started_at = now() where id = '00000000-0000-0000-0000-000000000030'$$, 'Submitted projects track running analysis');
select throws_ok($$update public.projects set analysis_status = 'failed' where id = '00000000-0000-0000-0000-000000000030'$$, '23514', null, 'Failed analysis requires an error and completion time');
select lives_ok($$update public.projects set analysis_status = 'failed', analysis_error = 'Provider unavailable', analysis_finished_at = now() where id = '00000000-0000-0000-0000-000000000030'$$, 'Analysis failure preserves the submission');
select lives_ok($$update public.projects set analysis_status = 'completed', analysis_error = null where id = '00000000-0000-0000-0000-000000000030'$$, 'Completed analysis is distinct from failure');

insert into public.analysis_results (id, project_id, final_version_id, iteration_id, analysis_version, model, rubric_version, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty) values
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000040', 'run-1', 'fixture-model', 'three-questions-v1', true, 'The claim was too strong', true, 'Checked the survey', true, 'Softened the claim', 'All three questions addressed', 'Cannot establish authorship');
select throws_ok($$update public.analysis_results set final_version_id = '00000000-0000-0000-0000-000000000051'$$, '23503', null, 'Analysis cannot reference another project final');
insert into public.flags (id, analysis_result_id, kind, evidence, explanation) values
  ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000060', 'thin_reflection', 'Looks good.', 'Possible low-effort reflection');
select throws_ok($$update public.flags set review_state = 'accepted'$$, '22P02', null, 'Invalid review states are rejected');
select throws_ok($$update public.flags set review_state = 'dismissed'$$, '23514', null, 'Review decisions require a reviewer and time');
select lives_ok($$update public.flags set review_state = 'dismissed', reviewed_by = '00000000-0000-0000-0000-000000000001', reviewed_at = now()$$, 'Dismissal records the instructor and time');
update public.flags set review_state = 'added_to_feedback', reviewed_at = now();
select is((select count(*)::integer from public.flag_reviews), 2, 'Changing a decision preserves both reviews');
insert into public.analysis_results (project_id, final_version_id, iteration_id, analysis_version, model, rubric_version, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty)
select project_id, final_version_id, iteration_id, 'run-2', model, rubric_version, ai_correctness_addressed, ai_correctness_evidence, verification_addressed, verification_evidence, changes_addressed, changes_evidence, explanation, uncertainty from public.analysis_results;
select is((select count(*)::integer from public.analysis_results), 2, 'Reanalysis retains the earlier result and reviewed flags');
select throws_ok($$update public.flags set review_state = 'open', reviewed_by = null, reviewed_at = null$$, '23514', null, 'Reopening cannot remove reviewer attribution');
select lives_ok($$update public.flags set review_state = 'open', reviewed_at = now()$$, 'Flags can be reopened with reviewer attribution');
select is((select count(*)::integer from public.flag_reviews), 3, 'Reopening preserves the earlier decisions');
insert into public.grader_notes (project_id, iteration_id, final_version_id, author_id, body) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'Check the survey reference.');
select throws_ok($$update public.grader_notes set final_version_id = '00000000-0000-0000-0000-000000000051'$$, '23503', null, 'Notes cannot reference another project final');
select throws_ok($$delete from public.final_versions where id = '00000000-0000-0000-0000-000000000050'$$, '23503', null, 'Final text supporting analysis and notes cannot be deleted individually');
select is((select count(*)::integer from pg_class join pg_namespace on pg_namespace.oid = relnamespace where nspname = 'public' and relkind = 'r' and relrowsecurity), 11, 'Every application table has RLS enabled');
set local role anon;
select throws_ok($$select * from public.iterations$$, '42501', null, 'Anonymous clients cannot read student text');
reset role;
set local role authenticated;
select is((select count(*)::integer from public.grader_notes), 0, 'Authenticated requests without a user cannot read private notes');
select throws_ok($$insert into public.profiles (id, display_name, role) values (gen_random_uuid(), 'Escalated user', 'instructor')$$, '42501', null, 'Client profile creation is denied');
reset role;
delete from public.projects where id = '00000000-0000-0000-0000-000000000030';
select is((select count(*)::integer from public.iterations) + (select count(*)::integer from public.analysis_results) + (select count(*)::integer from public.flags) + (select count(*)::integer from public.flag_reviews) + (select count(*)::integer from public.grader_notes), 0, 'Explicit project deletion removes its owned records');

select is((select count(*)::integer from public.final_versions), 1, 'Project deletion preserves another student final');

select * from finish();
rollback;

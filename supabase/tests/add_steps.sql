begin;
select plan(14);

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'teacher@steps.test', now()),
  ('00000000-0000-0000-0000-0000000000a2', 'student@steps.test', now()),
  ('00000000-0000-0000-0000-0000000000a3', 'other@steps.test', now());
update public.profiles set role = 'instructor' where id = '00000000-0000-0000-0000-0000000000a1';
insert into public.courses (id, instructor_id, code, title) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'STEPS', 'Steps');
insert into public.enrolments (course_id, student_id, email) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'student@steps.test'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3', 'other@steps.test');
insert into public.assignments (id, course_id, title, lane) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Essay', 'lane_2');
insert into public.projects (id, assignment_id, course_id, student_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3');
insert into public.iterations (project_id, step_number, ai_tool, prompt, raw_answer, critique) values
  ('00000000-0000-0000-0000-0000000000d1', 3, 'Claude', 'Earlier prompt', 'Earlier answer', 'Earlier critique');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);

select is(
  (select string_agg(step_number::text, ',' order by step_number) from public.add_steps('00000000-0000-0000-0000-0000000000d1', $$[
    {"ai_tool": "ChatGPT", "prompt": "First", "raw_answer": "One", "import_source": "public_link", "source_url": "https://chatgpt.com/share/6f2a0000-0000-4000-8000-000000000001", "source_conversation_id": "6f2a0000-0000-4000-8000-000000000001", "source_step_id": "m1"},
    {"ai_tool": "ChatGPT", "prompt": "Second", "raw_answer": "Two", "import_source": "public_link", "source_url": "https://chatgpt.com/share/6f2a0000-0000-4000-8000-000000000001", "source_conversation_id": "6f2a0000-0000-4000-8000-000000000001", "source_step_id": "m2"}
  ]$$::jsonb)),
  '4,5', 'Imported steps continue after the last step number');
select is((select string_agg(prompt, ',' order by step_number) from public.iterations where project_id = '00000000-0000-0000-0000-0000000000d1' and step_number > 3), 'First,Second', 'Steps keep the order they were given in');
select is((select count(*)::integer from public.iterations where project_id = '00000000-0000-0000-0000-0000000000d1' and critique is null and imported_at is not null and import_source = 'public_link'), 2, 'Imported steps wait for a critique and record when they were imported');

select is(
  (select count(*)::integer from public.add_steps('00000000-0000-0000-0000-0000000000d1', $$[
    {"ai_tool": "ChatGPT", "prompt": "First", "raw_answer": "One", "import_source": "public_link", "source_url": "https://chatgpt.com/share/6f2a0000-0000-4000-8000-000000000001", "source_conversation_id": "6f2a0000-0000-4000-8000-000000000001", "source_step_id": "m1"}
  ]$$::jsonb)),
  0, 'Importing a saved step again adds nothing');
select is(
  (select string_agg(step_number::text, ',' order by step_number) from public.add_steps('00000000-0000-0000-0000-0000000000d1', $$[
    {"ai_tool": "ChatGPT", "prompt": "First", "raw_answer": "One", "import_source": "public_link", "source_url": "https://chatgpt.com/share/6f2a0000-0000-4000-8000-000000000001", "source_conversation_id": "6f2a0000-0000-4000-8000-000000000001", "source_step_id": "m1"},
    {"ai_tool": "ChatGPT", "prompt": "Third", "raw_answer": "Three", "import_source": "public_link", "source_url": "https://chatgpt.com/share/6f2a0000-0000-4000-8000-000000000001", "source_conversation_id": "6f2a0000-0000-4000-8000-000000000001", "source_step_id": "m3"}
  ]$$::jsonb)),
  '6', 'A repeat import numbers only the new steps, with no gaps');
select is(
  (select step_number from public.add_steps('00000000-0000-0000-0000-0000000000d1', $$[
    {"ai_tool": "Gemini", "prompt": "Pasted", "raw_answer": "Pasted answer", "import_source": "pasted_text"}
  ]$$::jsonb)),
  7, 'Pasted steps carry no source and are always added');
select is(
  (select count(*)::integer from public.add_steps('00000000-0000-0000-0000-0000000000d1', $$[
    {"ai_tool": "Gemini", "prompt": "Pasted", "raw_answer": "Pasted answer", "import_source": "pasted_text"}
  ]$$::jsonb)),
  1, 'The same pasted text can be added twice because it has no source identity');

select throws_ok($$select * from public.add_steps('00000000-0000-0000-0000-0000000000d1', '[{"ai_tool": "ChatGPT", "prompt": " ", "raw_answer": "x", "import_source": "pasted_text"}]'::jsonb)$$, '23514', null, 'A blank prompt is rejected');
select is((select count(*)::integer from public.iterations where project_id = '00000000-0000-0000-0000-0000000000d1'), 6, 'A rejected batch adds no steps');
select throws_ok($$select * from public.add_steps('00000000-0000-0000-0000-0000000000d2', '[{"ai_tool": "ChatGPT", "prompt": "x", "raw_answer": "x", "import_source": "pasted_text"}]'::jsonb)$$, '42501', null, 'A student cannot add steps to someone else''s project');

select lives_ok($$update public.iterations set critique = 'Checked it.', marks = '[{"start": 0, "end": 3, "kind": "wrong", "note": "Not so"}]'::jsonb where project_id = '00000000-0000-0000-0000-0000000000d1' and step_number = 4$$, 'A student can save a critique and marks on their step');
select throws_ok($$update public.iterations set marks = '{"start": 0}'::jsonb where project_id = '00000000-0000-0000-0000-0000000000d1' and step_number = 4$$, '23514', null, 'Marks must be a list');

reset role;
update public.projects set status = 'submitted', submitted_at = now() where id = '00000000-0000-0000-0000-0000000000d1';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select throws_ok($$select * from public.add_steps('00000000-0000-0000-0000-0000000000d1', '[{"ai_tool": "ChatGPT", "prompt": "x", "raw_answer": "x", "import_source": "pasted_text"}]'::jsonb)$$, '42501', null, 'A submitted project accepts no new steps');

reset role;
set local role anon;
select throws_ok($$select * from public.add_steps('00000000-0000-0000-0000-0000000000d1', '[]'::jsonb)$$, '42501', null, 'Anonymous clients cannot call add_steps');

select * from finish();
rollback;

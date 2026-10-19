# Final Report, presentation and demo: what the course asks and where our evidence is

This maps the course's Final Report requirements and its Presentation and Technical Demo Guide to what we already have. Both documents are the course's, so they aren't stored here. They don't give a deadline or a team number, so we still need those. This is not the report. Section 1 has to be in our own words, and we shouldn't copy anything from Reports 1 and 2.

## Final Report

The marks are Section 1 (10%), Section 2 (30%), Section 3 (45%) and presentation quality (15%).

| Part | What the course asks for | Where our evidence is | Still missing |
| --- | --- | --- | --- |
| Cover page | Title and team members' names. | None. | Write it. |
| 1. Project overview and scope (10%, at most 1,000 words) | The context, the problem, the intended users and the scope. How the scope and design changed over time. In our own words. | [plan.md](../plan.md) for the problem, the scope and what we won't build. [design/README.md](../../design/README.md) and [DESIGN.md](../../DESIGN.md) for how the design changed from the prototype to Pentimento. | Write it, and count the words. Update what we learned from Reports 1 and 2 without copying them. |
| 2. User guide and walkthrough (30%) | How a user starts, finishes the main task, reads the output and deals with limits. Numbered screenshots. For each feature, its purpose and value. Access and set-up, inputs and outputs, system feedback, known constraints. The teaching team will use it to test the app. | [README.md](../../README.md) has the URL, the test accounts and the set-up. [testing/main-journey.md](../testing/main-journey.md) has the steps and what the app says at each one. | Take numbered screenshots of the student and instructor journeys. Write what each feature is for. List the constraints (the README's known limitations). |
| 3. Technical explanation (45%) | How user actions, data, processing, outside services, storage and outputs connect. A diagram, explained in the text. The core journey must work end to end, and we must say which parts are simulated or planned. One small snippet. Functional-test evidence with inputs, expected and actual results. Source code, URL, credentials, set-up. The AI-use declaration and a prompt log. | [architecture.md](../architecture.md): Figure 1 (overview), Figure 2 (schema), Figure 3 (data flow), the stage table, "Prototype versus working" and "Who can do what". [testing/main-journey.md](../testing/main-journey.md) for the tests. [flagging.md](../flagging.md) for the check and how well it works. | A snippet and the text around it. Our suggestion is the quote check in `src/lib/flagging/check.ts`, because it's what stops a made-up quote becoming a flag. The AI-use declaration and the prompt log, which we haven't written yet. |
| 4. Figures, citations, presentation (15%) | Every figure, table and chart numbered, captioned and mentioned in the text. Our own diagrams. A reference list in one style such as APA. | The three figures in `architecture.md` are numbered and captioned. | Number the rest. Write the reference list. We know of two sources from the proposal: Liu and Bridgeman (2023), and the University of Auckland two-lane page. Add the libraries and services we cite. |

Before we submit, the checklist asks for:

- [x] The artefact URL: https://days-capstone.vercel.app
- [x] Test credentials: the README (they're synthetic, so they're fine to share)
- [x] Source code: https://github.com/DDarrenYe/DAYS-Capstone
- [x] Set-up instructions: the README
- [ ] Functional-test evidence the markers can follow: a first version is in `testing/main-journey.md`, and #37 and #38 will add more
- [ ] Numbered, attributed visuals
- [ ] A complete reference list
- [ ] The AI-use declaration, filled in, and the prompt log

## Live presentation and Q&A (100 marks)

It's 6 minutes plus 4 minutes of questions. It isn't a product demo. It needs one original architecture diagram, and we have to explain what each arrow carries.

| Criterion | Marks | Where our evidence is |
| --- | --- | --- |
| Purpose, user and final scope | 25 | The problem, the users and what we won't build are in [plan.md](../plan.md). |
| Architecture and design reasons | 30 | Figure 1 in `architecture.md` is the diagram, or a cut-down Figure 3. The reasons are in "Who can do what" and "Text that leaves the app". |
| Implementation status and how we say it | 20 | "Prototype versus working" in `architecture.md` and the README's "What works today". |
| Questions, ownership and defence | 25 | Everyone should be able to answer on purpose, architecture, data, logic, test results, limits, and any AI-assisted part. `flagging.md` has the check's numbers and [testing/main-journey.md](../testing/main-journey.md) has the test results. |

## Demo video (200 marks)

It's at most 10 minutes, labelled with the team number and project title. It's the main technical evidence.

| Course suggestion | What we'd show |
| --- | --- |
| 30 s: the project and the core task | Figure 1, then the sign-in page. |
| About 3 min: one end-to-end journey | The testing page's journey: critique a waiting step, add a pasted step, write the essay with a copied sentence, submit, then open it as the instructor and download the CSV. |
| About 3 min: two test scenarios, each with input, expected result, actual result and pass or fail | A normal case: T5 and T7 (49% unmatched, locked). An alternative case: T6 (submit blocked until step 6 has a critique), or T12 (a student gets a 403 on the export). |
| About 2 min: data, logic and components | The tables in Figure 2, the matcher's 6-word rule, the quote check. |
| About 1 min: limits, future work, material AI use | The README's known limitations, the Progress page as example data, and what AI tools we used. |

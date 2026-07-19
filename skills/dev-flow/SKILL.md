---
name: dev-flow
description: "Orchestrates the 8-step development workflow with a task checklist. Use when starting a new feature, bug fix, or non-trivial change. Triggers on \"dev flow\", \"start feature\", \"development workflow\", \"new feature workflow\"."
---

# Dev Flow — Development Workflow Orchestrator

Run a structured 8-step development workflow with a task checklist you can track as you go.

## Workflow

1. **Ask for change description**: Get a brief description of what the user wants to build or change.

2. **Classify the change type** — pick one:
   - **Logic-only** — business logic, utils, composables, store actions (no UI changes)
   - **UI-only** — component templates, styles, layout (no logic changes)
   - **API contract change** — modifying request/response shapes, endpoints, or data contracts
   - **Full user-flow** — spans UI, logic, and API layers

3. **Create an 8-step checklist** with the descriptions below, adapted by
   change type. Use the current agent's planning or task-tracking capability
   when available; otherwise maintain the checklist in the conversation:

| # | Task title | Instructions | Skill/Action |
|---|-----------|--------------|--------------|
| 1 | Understand existing flow | Map entry points, state, API calls, existing tests. Invoke `understand-feature`. | `understand-feature` |
| 2 | Extract test impact | Generate a test plan before writing any code. Invoke `test-impact`. | `test-impact` |
| 3 | Clarify requirements | Ask product/backend questions. Confirm change type and scope. | Conversation |
| 4 | Write failing tests | Write or update tests based on the test impact report from step 2. | Code |
| 5 | Implement the feature | Write the actual code to make the failing tests pass. | Code |
| 6 | Run unit tests | Run `npm run test:unit` or `pytest` for fast feedback. | Shell |
| 7 | Run e2e tests | Run `npm run test:e2e` or the project's e2e command. | Shell |
| 8 | Review sweep | Invoke `review-sweep` for edge cases, flaky risk, and coverage gaps. | `review-sweep` |

4. **Adapt emphasis by change type:**
   - **Logic-only:** Emphasize steps 4 and 6 (unit tests). Steps 7 can be lightweight or skipped if no UI impact.
   - **UI-only:** Emphasize steps 4 and 7 (e2e tests). Unit tests can be lightweight.
   - **API contract change:** Flag contract verification in steps 2 and 8. Emphasize checking all consumers of the changed API.
   - **Full user-flow:** All steps equally weighted.

   Add a note to each task description reflecting this emphasis (e.g., "[Primary focus for this change type]" or "[Lightweight — skip if no UI impact]").

5. **After creating all tasks**, tell the user:
   - Start with task 1
   - Mark tasks complete as they go
   - Each task description reminds them what skill to invoke or what action to take

## Output format

After creating the tasks, print a summary like:

```
## Dev Flow: [change description]
Type: [change type]

8 tasks created. Start with task 1: Understand existing flow.
Use `understand-feature` to begin, then work through the checklist.
```

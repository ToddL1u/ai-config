---
name: team
description: Coordinate a task across multiple agents or specialized skills when the user explicitly asks to use a team, delegate work, split work among agents, run parallel agents, or orchestrate a multi-agent workflow. Do not trigger for ordinary requests such as "help me" or "I need to" unless collaboration is explicitly requested.
---

# Team — AI Team Orchestrator

Act as the team lead. Classify the task and choose the right workflow. Delegate
bounded work when collaboration capabilities are available; otherwise execute
the same steps directly without reducing verification quality.

## Step 0: Ticket Setup (optional)

If `$ARGUMENTS` contains a Jira URL or issue key (e.g. `SPF-123`, `https://...atlassian.net/...`):

Invoke the `start-ticket` skill with the issue key or URL. It handles the branch
check, sync, ticket fetch, prefix choice, and branch creation.

After `start-ticket` completes, use the ticket title and acceptance-criteria
bullets as the task description for Step 1. Skip asking what to accomplish.

If no ticket is provided, proceed to Step 1 as normal.

## Step 1: Parse the Request

Read `$ARGUMENTS` and determine:
- What the user wants to accomplish
- How complex it is
- Whether it spans multiple concerns (UI, API, data, docs)

Check for explicit flags:
- `--full` → force the full eight-step `dev-flow` workflow
- `--light` → force light MVP flow
- `--dry` → just show the plan, don't execute

## Step 2: Classify the Task

Pick ONE task type:

| Task Type | Signal Words | Route |
|-----------|-------------|-------|
| **Product Planning** | "idea", "MVP", "product", "should I build", "scope" | → `mvp-plan` skill |
| **Feature (simple)** | "build", "add", "create" + single concern | → MVP Flow (Step 3a) |
| **Feature (complex)** | multi-layer, touches UI + API + data, "thorough", "careful" | → Full Flow (Step 3b) |
| **Bug Fix** | "fix", "broken", "error", "not working", "bug" | → Bug Flow (Step 3c) |
| **Debugging** | "debug", "root cause", "investigate", "diagnose", "why is this" | → `debug` skill |
| **Exploration** | "how does", "understand", "trace", "explain", "what is" | → `understand-feature` skill |
| **Testing/QA** | "test", "coverage", "accessibility", "QA", "a11y" | → testing workflow |
| **Browser QA** | "check in browser", "visual QA", "verify in browser", "browser test" | → `qa-browser` skill |
| **Ship/Release** | "ship", "release", "ready to ship", "create PR", "ship it" | → `ship` skill |
| **Documentation** | "document", "save to notion", "write docs", "capture learnings" | → documentation workflow |
| **Multi-step Project** | Complex request spanning 3+ types | → Project Flow (Step 3d) |

If unclear, ask the user: "Is this a quick feature or something more complex?"

## Step 3a: MVP Flow (default for simple features)

Create a four-step checklist using available planning support, or track it in
the conversation when no task tool exists:

| # | Task | Agent/Action |
|---|------|-------------|
| 1 | Quick explore | Delegate a read-only scan when possible, or inspect directly. Find entry points and similar code. |
| 2 | Implement | Delegate implementation when appropriate, or implement directly using the exploration results. |
| 3 | Quick test | Delegate independent QA when possible, or run tests and basic accessibility checks directly. |
| 4 | Wrap up | Ask whether to save learnings to Notion; use the documentation workflow if requested. |

Mark each task complete as it finishes. Pass results from each step to the next.

## Step 3b: Full Flow (for complex features)

Tell the user: "This is a complex feature — using the full development workflow."

Invoke `dev-flow` with the feature description. It handles the eight-step process:
- Step 5 (Implement) → delegate when an implementation subagent is available, otherwise execute directly
- Step 4 (Write tests) → delegate independent QA when available, otherwise execute directly

## Step 3c: Bug Flow (abbreviated)

For simple bugs (obvious cause, single file):

| # | Task | Agent/Action |
|---|------|-------------|
| 1 | Reproduce & diagnose | Delegate a read-only trace when possible, or trace directly and identify the root cause. |
| 2 | Fix | Delegate or implement the diagnosed fix directly. |
| 3 | Verify | Delegate independent verification when possible, or run tests and add a regression test directly. |

For non-trivial bugs (unclear cause, intermittent, multi-file), invoke the
`debug` skill. It handles reproduce → isolate → hypothesize → verify → fix.

## Step 3d: Project Flow (for multi-step projects)

Create a project checklist. Assign steps to suitable subagents only when the
current agent exposes collaboration; otherwise complete them directly:

| # | Step | Agent |
|---|------|-------|
| 1 | Scope & validate the idea | Product-planning specialist or direct workflow |
| 2 | Design architecture | Architecture specialist or direct workflow |
| 3 | Explore existing code | Read-only explorer or direct inspection |
| 4 | Implement | Implementation specialist or direct work |
| 5 | Test | QA specialist or direct verification |
| 6 | Review | Independent reviewer or direct review pass |
| 7 | Document | Documentation specialist or direct documentation |

Execute sequentially. After each step, briefly report what was done and what's next. Pass context from each step to the next step's agent prompt.

## Step 4: Report

After all tasks are complete, print a summary:

```
## Team Report: [task description]
Flow: [MVP / Full / Bug / Project]
Steps completed: [X/Y]

### What was done
- [bullet list of changes]

### Files modified
- [file list]

### Follow-up needed
- [anything that wasn't covered]
```

For completed code changes, ask: **"Ready to create a PR?"** Do not offer a PR
for planning, exploration, documentation-only, or other non-code work.

If yes, invoke the `pr` workflow to fill the repository template. Use an
available GitHub connector, CLI, or browser capability only after the user has
authorized publication. If no publishing capability exists, return the filled
template and exact next step without claiming the PR was created.

## Guidelines

- **Don't over-delegate**: If the task is trivial (rename a variable, fix a typo), just do it directly. Don't spin up agents for 30-second tasks.
- **Pass context forward**: Each agent prompt should include relevant results from previous steps. Don't make agents re-discover what previous agents already found.
- **Ask, don't assume**: If the classification is ambiguous, ask the user before proceeding.
- **One thing at a time**: Execute steps sequentially. Don't launch multiple agents in parallel unless they're truly independent (e.g., exploring two unrelated areas).

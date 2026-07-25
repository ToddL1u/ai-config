---
name: parallel-work
description: Coordinate two or more genuinely independent, bounded subtasks across available agents with explicit permissions, ownership, and parent-owned integration. Use automatically when a controlling workflow or the user requests parallel agents and parallelism provides meaningful benefit. Do not use for ordinary tasks, sequential lifecycle steps, overlapping writes, or general workflow routing.
---

# Parallel Work

Coordinate independent work without owning the surrounding workflow. The
controlling skill or parent agent retains scope, decisions, integration, and
final verification.

## Activate only when

Require all three conditions:

1. At least two subtasks are genuinely independent.
2. Each subtask has a bounded, separately verifiable output.
3. Parallel execution offers meaningful benefit beyond coordination cost.

Do not activate for tiny tasks, sequential steps, overlapping decisions, or
work where one result determines how the next task must be framed.

A request to "use parallel agents" does not override these conditions. When the
threshold fails, do not spawn subagents. Execute the task directly if it remains
in scope, or return it to the controlling workflow, and report:

```text
Parallel work not activated — <task is too small / subtasks are dependent /
ownership overlaps / coordination cost exceeds benefit>
```

## Define contracts

Before delegation, define for each subtask:

- objective and expected output;
- required inputs and shared context;
- allowed scope and explicit exclusions;
- read or write permission;
- file or component ownership when writes are allowed;
- verification evidence to return.

Give agents only the context required for their task. Do not let delegated
agents expand scope or redelegate unless the controlling workflow explicitly
requires nested coordination.

## Protect the workspace

Default every subtask to read-only.

Allow writes only when the user or controlling workflow explicitly authorizes
implementation and ownership is disjoint. Never assign the same file to
concurrent writers. If safe ownership cannot be established, execute the work
sequentially.

Before parallel writes, record the working-tree state. After agents finish, the
parent must inspect every change, resolve conflicts, integrate results, and run
the required verification. Agent completion is not integration evidence.

## Execute

1. Identify the dependency graph and select only the independent frontier.
2. Launch bounded tasks concurrently when collaboration is available.
3. Collect every result before integration.
4. Preserve attribution, evidence, disagreements, and unresolved questions.
5. Let the parent resolve contradictions and verify the combined outcome.
6. Repeat only if another independent frontier remains.

Do not choose product, development, debugging, review, or release workflows.
Do not create tickets, branches, commits, deployments, or pull requests unless
the controlling workflow separately authorizes that exact action.

## Sequential fallback

When collaboration is unavailable, return control to the parent with the same
bounded task contracts. The parent may execute them one at a time and must label
the result:

```text
Sequential fallback — parallel agents unavailable
```

Do not weaken stricter isolation requirements imposed by a controlling skill.
For example, follow `review-sweep`'s own reviewer fallback policy.

## Report

```markdown
## Parallel Work Report

Mode: <parallel / sequential fallback>

### Tasks
- <task and permission> → <result and evidence>

### Integration
- <parent decisions, conflicts, and combined verification>

### Unresolved
- <disagreements, risks, or follow-up>
```

Omit empty sections. Report partial or failed subtasks honestly; do not hide
them behind an aggregate success statement.

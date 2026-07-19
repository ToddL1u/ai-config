---
name: dev-flow
description: "Implement a feature through a bounded inspect, plan, build, verify, and review loop with persistent progress. Use when starting or continuing a feature, non-trivial product change, or ticket implementation. Triggers on: dev flow, start feature, implement feature, continue feature, development workflow."
---

# Dev Flow

Implement one feature to verified completion without requiring turn-by-turn prompting.

## Start

1. Read the request, repository instructions, and relevant project documentation.
2. Read [references/feature-standards.md](references/feature-standards.md).
3. Read [references/feature-loop.md](references/feature-loop.md) and follow it until a terminal state is reached.
4. For work that will span multiple iterations or sessions, copy [assets/feature-progress.md](assets/feature-progress.md) to `.ai/feature-progress.md`. Reuse an existing file for the same feature; do not erase useful history.

Use the repository's own commands and conventions. Do not assume a framework, package manager, branch name, or test command.

## Compose existing skills

- Invoke `understand-feature` when entry points, dependencies, or the current behavior are unclear.
- Invoke `test-impact` before coding when the change is non-trivial or test impact is unclear.
- Invoke `review-sweep` after verification passes and before declaring success.
- Use the current agent's plan or task tracker when available; keep `.ai/feature-progress.md` as the durable cross-session record.

Do not pause merely to ask whether to proceed to the next loop step. Continue while the next action is safe, in scope, and objectively verifiable. Stop at the terminal conditions in the loop.

## Final report

Report:

- terminal state: `SUCCESS`, `BLOCKED`, `STALLED`, or `EXHAUSTED`;
- changes made;
- verification evidence;
- unresolved risks or decisions;
- next action, if not successful.

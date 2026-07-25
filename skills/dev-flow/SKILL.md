---
name: dev-flow
description: "Implement a feature through a bounded inspect, plan, build, verify, and review loop with persistent progress. Use when starting or continuing a feature, non-trivial product change, or ticket implementation. Triggers on: dev flow, start feature, implement feature, continue feature, development workflow."
---

# Dev Flow

Implement one feature to verified completion without requiring turn-by-turn prompting.

## Start

1. Read the request, repository instructions, and relevant project documentation.
2. Before any implementation edit, record the current `HEAD` commit as the
   review fixed point and capture the initial working-tree status. Keep this
   fixed point for every implementation/review iteration in this run.
3. Classify the input:
   - **Raw request** — derive acceptance criteria during the Specify step.
   - **Approved spec** — treat its goals, required behavior, non-goals,
     constraints, and testing decisions as authoritative. Record its stable
     reference and version. Do not re-specify or reopen confirmed decisions.
   - **Approved ticket** — read its linked approved spec and verify the stated
     version and blockers. Confirm that both artifacts explicitly record
     approved status. Treat the ticket's behavior and acceptance criteria as
     the active slice, and the spec's goals, non-goals, constraints, and testing
     decisions as its boundary. Record both stable references. Do not re-specify
     or split the ticket again.
4. Record the authoritative review sources:
   - approved ticket and parent spec references and versions;
   - approved spec reference and version; or
   - acceptance criteria, constraints, and non-goals derived from a raw
     request.
5. Read [references/feature-standards.md](references/feature-standards.md).
6. Read [references/feature-loop.md](references/feature-loop.md) and follow it until a terminal state is reached.
7. For work that will span multiple iterations or sessions, copy [assets/feature-progress.md](assets/feature-progress.md) to `.ai/feature-progress.md`. Reuse an existing file for the same feature; do not erase useful history.

If an approved spec or ticket is missing information required to implement
safely, conflicts with the repository, or has an incomplete blocker, enter
`BLOCKED` and identify the exact contradiction. Do not silently rewrite the
artifact or expand the ticket.

Use the repository's own commands and conventions. Do not assume a framework, package manager, branch name, or test command.

## Compose existing skills

- Invoke `understand-feature` when entry points, dependencies, or the current behavior are unclear.
- Invoke `test-impact` for a non-trivial raw request, or when an approved test
  seam is missing, stale, or contradicted by repository evidence. Do not
  rediscover a valid seam already approved by a spec or ticket.
- Invoke `tdd` by default for executable behavior at an approved public seam.
  Complete one red-green-cleanup cycle before writing the next failing test;
  never batch multiple new red tests. When no meaningful executable seam
  exists, record the TDD exception and use deterministic verification instead.
- Invoke `review-sweep` in WIP mode after verification passes and before
  declaring success. Pass the recorded fixed point and authoritative sources so
  the review includes committed, staged, unstaged, and untracked work.
- Use the current agent's plan or task tracker when available; keep `.ai/feature-progress.md` as the durable cross-session record.

Do not pause merely to ask whether to proceed to the next loop step. Continue while the next action is safe, in scope, and objectively verifiable. Stop at the terminal conditions in the loop.

## Final report

Report:

- terminal state: `SUCCESS`, `BLOCKED`, `STALLED`, or `EXHAUSTED`;
- changes made;
- testing strategy source: approved artifact, `test-impact`, or recorded TDD
  exception;
- red and green evidence for each TDD cycle, or deterministic exception
  verification;
- verification evidence;
- review fixed point, source references, and overall verdict;
- unresolved risks or decisions;
- next action, if not successful.

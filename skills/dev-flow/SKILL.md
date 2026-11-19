---
name: dev-flow
description: "Dev flow: implement one feature, board card, or ticket end to end through a bounded inspect, plan, build, verify, and review loop with persistent progress. Use when asked to implement or continue a feature, card, or ticket."
---

# Dev Flow

Implement one feature to verified completion without requiring turn-by-turn prompting.

## Start

1. Read the request, repository instructions, and relevant project documentation.
2. Before any implementation edit, inspect existing progress for this feature.
   On continuation, reuse its original review fixed point; never reset it to
   the current `HEAD`. For new work, record the current `HEAD` and initial
   working-tree status. If work already exists and no reliable baseline is
   available, resolve it from history or ask rather than omit prior changes.
   Keep the same fixed point through commits, corrections, and resumed sessions.
   Identify pre-existing changes separately; do not overwrite or claim them.
3. Classify the input:
   - **Raw request** — derive acceptance criteria during the Specify step.
   - **Confirmed handoff** — import the user-confirmed grilling objective,
     decisions, constraints, exclusions, success criteria, and source references.
     Preserve confirmed decisions; investigate only missing information or new
     contradictions. Confirmation does not imply external stakeholder approval.
   - **Approved spec** — treat its goals, required behavior, non-goals,
     constraints, and testing decisions as authoritative. Record its stable
     reference and version. Do not re-specify or reopen confirmed decisions.
   - **Approved ticket** — read its linked approved spec and verify the stated
     version and blockers. Confirm that both artifacts explicitly record
     approved status. Treat the ticket's behavior and acceptance criteria as
     the active slice, and the spec's goals, non-goals, constraints, and testing
     decisions as its boundary. Record both stable references. Do not re-specify
     or split the ticket again.
   - **Board card** — the request carries a board card's text (as a worker
     dispatched by `implement-board` receives it), or names no other input
     while `.ai/current-card.md` exists. Treat the card's outcome, acceptance
     criteria, scope, and non-goals as the active slice, and its source
     references (PRD, Figma, spec, ticket) as authoritative. Record the card key
     and its board path. Do not split the card again.

     When the card came from `.ai/current-card.md`, read its board's frontier
     first: cards whose status is `Ready` and whose dependencies are all
     `Done`. With two or more frontier cards whose scopes touch separate files,
     stop before editing and offer the user two choices: run them all in
     parallel with `/implement-board <feature>`, or build only the current card
     here. With one frontier card, or cards that share files, continue with the
     current card and say why.
4. Record the authoritative review sources:
   - approved ticket and parent spec references and versions;
   - board card key, board path, and the card's source references;
   - approved spec reference and version;
   - confirmed handoff and its requirement source references; or
   - acceptance criteria, constraints, and non-goals derived from a raw
     request.
   For ticket work, inspect the supplied Jira, PRD, and Figma sources relevant
   to the slice. Record their versions or retrieval dates and discrepancies.
   Do not silently treat inaccessible sources as checked or invent precedence
   when they conflict. Distinguish user engineering decisions from product or
   design decisions that require the responsible stakeholder's confirmation.
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
- Invoke `test-impact` for a non-trivial raw request or confirmed handoff without
  an established testing strategy, or when an approved test
  seam is missing, stale, or contradicted by repository evidence. Do not
  rediscover a valid seam already approved by a spec or ticket.
- Invoke `tdd` by default for executable behavior at an approved public seam.
  Complete one red-green-cleanup cycle before writing the next failing test;
  never batch multiple new red tests. When no meaningful executable seam
  exists, record the TDD exception and use deterministic verification instead.
- Invoke `review-sweep` in WIP mode after verification passes and before
  declaring success. Pass the recorded fixed point and authoritative sources so
  the review includes committed, staged, unstaged, and untracked work.
- When the user requests `codex-review`, pass the same original fixed point,
  requirement sources, and verification evidence. Keep it separate from the
  internal `review-sweep`; do not add an unsolicited second-model review.
  After the user's disposition of findings, implement authorized corrections,
  rerun affected checks, and request Codex re-review of the complete updated
  task from the same fixed point. Apply the existing repair limits and report
  unresolved findings; do not commit on the strength of a stale review.
- Invoke `parallel-work` only when at least two bounded subtasks are independent
  and parallelism provides meaningful benefit. Keep this skill's lifecycle,
  integration, and final verification with the parent agent.
- Use the current agent's plan or task tracker when available; keep `.ai/feature-progress.md` as the durable cross-session record.

Do not pause merely to ask whether to proceed to the next loop step. Continue while the next action is safe, in scope, and objectively verifiable. Stop at the terminal conditions in the loop.

## Final report

When the input was `.ai/current-card.md` and the terminal state is `SUCCESS`,
set that card's `Status` to `Done` on its board. Leave `Last verified` for the
next `to-tickets` sync. A card passed in the request belongs to a coordinator
that owns the board, so leave the board to it.

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

---
name: to-tickets
description: Break resolved requirements into a private, dependency-aware board of vertical-slice cards, and optionally publish them to a tracker.
disable-model-invocation: true
---

# To Tickets

Turn one feature's requirements into a small execution map: a directed acyclic
graph of vertical-slice cards on a private board, with one card selected for
`dev-flow`. Plan only: product code, specs, and commits stay untouched.

## 1. Read the requirements source

Accept one of these, and record stable references for it:

- **Approved spec**: a stable reference and version whose status is `Approved`.
  Read the full artifact; when the reference, version, or approval is missing,
  stop without drafting.
- **PRD and Figma**: the exact PRD sections and Figma frames or nodes.
- **Tracker item**: a Jira ticket or GitHub issue ID.
- **Resolved conversation**: decisions already confirmed in this session, such
  as a grilling outcome.

Then read repository instructions, domain docs, ADRs, and the relevant code and
tests. The source is authoritative and stays unmodified: confirmed decisions are
fixed, and gaps become assumptions or open questions. Return to `grilling` when
an open question would change scope, user behaviour, sequencing, or acceptance.

## 2. Open the board

Each feature owns one durable board, reused every time the feature changes:

- `.ai/boards/<feature>.md`: Epic, card map, dependencies, assumptions, and
  status. `<feature>` is a stable kebab-case slug naming the product feature.
- `.ai/current-card.md`: the one card about to enter `dev-flow`; one per
  worktree, overwritten each time.

Take the slug from the invocation. Otherwise list `.ai/boards/` and ask which
board this work belongs to, offering a new slug as one option. A branch can
touch a feature it is not named after, so the branch name never decides the
slug.

`.ai/` stays private. Check `git check-ignore -q .ai/`; when it fails, add the
line `.ai/` to the file `git rev-parse --git-path info/exclude` names. The
shared `.gitignore` and `.ai/` files stay out of every commit.

- **Create** when no board exists: copy
  [assets/feature-board.md](assets/feature-board.md).
- **Sync** when one exists. A board is a claim about code that has moved:
  1. Compare its `Last verified` commit with `HEAD`; when they match, skip to
     the breakdown.
  2. Check every path, component, and endpoint it names still exists. Correct
     what moved; mark what is gone as removed, keeping the card's history.
  3. Correct any card status the code or test suite contradicts.
  4. Report the drift before proposing new cards.

  Then reopen the card that owns a changed behaviour, and add a card only for
  behaviour no card owns.

The Epic header always carries `Feature:`, `Branch:` (where the last update was
made), and `Last verified: <short SHA> (<YYYY-MM-DD>)`, refreshed on every
create, sync, and edit. A board whose `Last verified` predates the feature's
latest commit is untrusted until re-verified.

## 3. Break down the feature

1. State the Epic as one user or business outcome, with explicit exclusions.
2. Define a short sequence of cards. Each card is a user-observable or
   independently verifiable vertical slice through every layer it needs, and
   fits one fresh `dev-flow` run that lands green. One behaviour stays one
   card, never split into UI, API, database, or test cards. See
   [references/example.md](references/example.md).
3. A wide mechanical refactor that cannot land green as one slice is the
   exception: express it as expand, bounded migration batches, then contract,
   with contract blocked by every batch.
4. Give every card a stable key (`C1`, `C2`, …) and every field of the card
   quality bar below.
5. Draw dependencies as `C1 -> C2`, then validate the graph: acyclic, at least
   one `Ready` card, blockers before dependants, every source requirement
   covered once or intentionally shared, nothing beyond the source.
6. Select one `Ready` card and copy its context into `.ai/current-card.md`
   from [assets/current-card.md](assets/current-card.md), keeping useful notes
   already there.

Local statuses are `Proposed`, `Ready`, `In progress`, `Blocked`, and `Done`.
Update the board after the user confirms a changed plan or a card's status
becomes known. Board text stays in English.

### Card quality bar

- **Outcome:** a complete user path or independently verifiable result.
- **Scope and non-goals:** only what that outcome needs.
- **Mock-first:** what to mock now, what production integration is deferred,
  and the condition for replacing the mock; `Not needed` only when a mock adds
  no value.
- **Acceptance criteria:** observable checks, including empty, error, and
  permission states that are part of the path.
- **Verification:** how the criteria will be demonstrated.
- **Dependencies:** only cards or external decisions that block the start.
- **Source references:** the governing PRD sections, Figma frames, spec
  version, or ticket, plus an unavailable-source blocker when access is needed.
- **Assumptions and open questions:** links to board entries; the card is
  `Blocked` while either makes acceptance unknowable.

## 4. Publish (only on request)

Publish only when the user names a destination: one tracker project (Jira,
GitHub Issues) or one repository ticket-set file. The board stays the planning
record either way.

1. Draft one ticket per card from [assets/ticket-body.md](assets/ticket-body.md).
2. Show the destination, the numbered graph, and every ticket body, and ask one
   approval question covering all three. Approval comes from this invocation,
   after this preview; earlier approvals, files, or tracker states never stand
   in for it. Any change to the shown content gets a fresh preview.
3. Use `<feature slug or spec reference@version> + <card key>` as each ticket's
   fingerprint. Reuse an exact match in the destination, and create only the
   missing tickets, in topological order.
4. Add native blocking links when the tracker has them; otherwise write the real
   references into `Blocked by`. Leave the source spec and any parent issue
   unchanged.
5. Re-read what was published and verify bodies, source, and edges. Record each
   real ticket ID in the card's `Tracker:` field on the board.

When publishing fails partway, keep what was created: report the created and
reused mappings, the first failed operation, and what remains, so a retry
resumes from there. A repository ticket-set file is written but not committed.

## 5. Report

Report the Epic, any sync drift, cards in topological order, the selected card,
graph validation, open questions needing `grilling`, and published IDs when
published. Then stop: the user starts `/dev-flow` next.

## Source

Merges the former `feature-breakdown` skill with Matt Pocock's
[to-tickets](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets).
MIT License, Copyright (c) 2026 Matt Pocock; see [LICENSE](LICENSE).

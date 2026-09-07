---
name: feature-breakdown
description: Split one large product feature into a private, dependency-aware Epic and user-observable vertical-slice cards before implementation. Use when a feature is too large for one dev-flow, needs mock-first boundaries, or has incomplete PRD or Figma decisions; use also when changing a feature that already owns a board under .ai/boards/, to reconcile that board with the current code before planning the change. Use after grilling resolves material product choices and before dev-flow implements a card.
---

# Feature Breakdown

Turn one feature into a small local execution map. Plan only; do not implement
product code, create tracker tickets, use Jira or another online service, or
commit work notes.

## Private workspace

Boards are per feature, not per branch. A feature outlives the branches that
change it, so one durable board per maintained feature is reused every time that
feature is touched.

- `.ai/boards/<feature>.md` — Epic, card map, dependencies, assumptions, and
  status for one feature. `<feature>` is a stable kebab-case slug naming the
  product feature, never a ticket key or branch name.
- `.ai/current-card.md` — execution context for the one card about to enter
  `dev-flow`. One per worktree, overwritten each time.

Take the feature slug from the invocation when given. Otherwise list
`.ai/boards/` and ask which existing board this work belongs to, offering a new
slug as one option. Never guess the slug from the branch name; a branch may
touch a feature it is not named after.

`.ai/` is expected to be ignored. Verify with `git check-ignore -q .ai/` and,
only when that fails, add the exact line `.ai/` to the path reported by
`git rev-parse --git-path info/exclude`. Do not edit the shared `.gitignore`.
Never stage or commit `.ai/` files.

## Choose create or sync

Read `.ai/boards/<feature>.md` before anything else.

**Create** when no board exists for the feature. Copy
[assets/feature-board.md](assets/feature-board.md), then break the feature down
as below.

**Sync** when a board exists. The board is a claim about code that has since
moved, so reconcile it before planning anything new:

1. Compare its `Last verified` commit with `HEAD`. Nothing to reconcile when
   they match.
2. Check every path, component, and endpoint the board names still exists.
   Correct what moved; mark what is gone as removed rather than deleting the
   card's history.
3. Correct any card status contradicted by the code or the test suite.
4. Report what drifted before proposing new cards. A silently corrected board
   teaches the user nothing about how far it had rotted.

Then add cards for the new work, reopening an existing card when the change
alters a behaviour that card already owns. Prefer reopening over adding: a
changed pick flow belongs in the card that owns picking, not in a new card.

Copy [assets/current-card.md](assets/current-card.md) only when it does not
exist; preserve useful existing notes.

## Keep a board honest

Every board carries, in its Epic header:

- `Feature:` the stable slug.
- `Branch:` the branch the last update was made on.
- `Last verified: <short SHA> (<YYYY-MM-DD>)` — set on every create and every
  sync, and never left stale after editing the board.

A board whose `Last verified` predates the feature's most recent commit is
untrusted input. Re-verify it against the code before relying on a single line
of it, and say so rather than presenting it as current.

## Break down the feature

1. Read repository instructions and the available PRD, Figma, domain docs, and
   relevant code. Record stable source references available for this run,
   including the exact Figma frame or node and PRD section when provided. Treat
   confirmed decisions as fixed.
2. State the Epic as one user or business outcome, including explicit
   exclusions.
3. Record incomplete PRD or Figma details as assumptions and open questions.
   Do not invent decisions. Return to `grilling` when an unanswered question
   materially changes scope, user behaviour, sequencing, or acceptance.
4. Define a short sequence of cards. Each card must be a user-observable or
   independently verifiable vertical slice through every layer it needs. Do
   not split the same behaviour into UI, API, database, test, or component
   cards.
5. Give every card a stable local key (`C1`, `C2`, …), a status, genuine
   blockers, a mock-first scope, and observable acceptance criteria. Prefer a
   card that fits one fresh `dev-flow` run and can land green.
6. Draw dependencies as `C1 -> C2` and check that the graph is acyclic, at
   least one card is `Ready`, and blockers precede dependants.
7. Select only one `Ready` card. Copy its context into `.ai/current-card.md`, and update the board's
   `Last verified` line.
   The next implementation workflow is `dev-flow`; do not start it yourself.
   When the user needs another agent to implement the card, `executor-handoff`
   may create a source-pinned implementation brief first.

Use `Proposed`, `Ready`, `In progress`, `Blocked`, and `Done` only as local
statuses. Update the board after the user confirms a changed plan or after a
card's status is known, refreshing `Last verified` each time. Keep all skill-generated text, templates, and metadata
in English.

## Card quality bar

Each card must contain:

- **Outcome:** a complete user path or independently verifiable result.
- **Scope and non-goals:** only what is needed for that outcome.
- **Mock-first:** what can be mocked to validate the path now, what production
  integration is deliberately deferred, and the condition that permits
  replacing the mock. Use `Not needed` only when a mock would add no value.
- **Acceptance criteria:** observable checks, including empty, error, or
  permission states when they are part of the path.
- **Verification:** how the criteria will be demonstrated.
- **Dependencies:** only cards or external decisions that truly block start.
- **Source references:** the PRD sections and Figma frames or nodes that govern
  this card, plus an explicit unavailable-source blocker when access is needed.
- **Assumptions and open questions:** links to the board entries; mark the card
  `Blocked` when either one makes acceptance unknowable.

Avoid technical-layer cards such as “build leaderboard API” or “create
tournament components.” Instead describe the smallest complete behaviour, for
example “a signed-in competitor can join an individual tournament before its
start time and sees their ranking after a submitted result.”

## KanaMaster Tournament example

For an Epic, “Let players run KanaMaster tournaments,” a reasonable local map
is:

| Card | Vertical slice | Mock-first boundary | Depends on |
| --- | --- | --- | --- |
| C1 | A player sees an upcoming individual tournament and its time CTA, then joins before the start time. | Use fixture tournament and join result; defer live scheduling service. | None |
| C2 | A player chooses a partner and both see a pending partner-tournament entry. | Use fixture partner availability and approval result; defer invitation delivery. | C1 |
| C3 | After a completed tournament, a player sees the leaderboard and their own placement. | Use fixture scores and ranking calculation contract; defer live score ingestion. | C1 |

An acceptance criterion for C1 is: “Given an upcoming individual tournament,
the eligible player sees its local start time and a Join CTA; after joining,
the CTA changes to Joined; after the start time, joining is unavailable with a
clear reason.” If timezone display or late-join policy is unconfirmed, record
it as an open question instead of guessing.

## Handoff

Report the Epic, cards in topological order, the immediately ready card, graph
validation, assumptions, and questions requiring `grilling`. End after the
breakdown. Do not invoke `executor-handoff`, `dev-flow`, `to-tickets`, or any implementation
workflow.

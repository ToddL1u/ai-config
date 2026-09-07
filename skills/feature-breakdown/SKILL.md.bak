---
name: feature-breakdown
description: Split one large product feature into a private, dependency-aware Epic and user-observable vertical-slice cards before implementation. Use when a feature is too large for one dev-flow, needs a local worktree progress board, needs mock-first boundaries, or has incomplete PRD or Figma decisions; use after grilling resolves material product choices and before dev-flow implements a card.
---

# Feature Breakdown

Turn one feature into a small local execution map. Plan only; do not implement
product code, create tracker tickets, use Jira or another online service, or
commit work notes.

## Private workspace

Use one board for the current worktree:

- `.ai/feature-board.md` — Epic, card map, dependencies, assumptions, and
  status.
- `.ai/current-card.md` — execution context for the one card about to enter
  `dev-flow`.

Before creating either file, run `git rev-parse --git-path info/exclude`. Add
the exact line `.ai/` to that worktree's resulting exclude file when absent.
Do not edit the shared `.gitignore`. Copy
[assets/feature-board.md](assets/feature-board.md) and
[assets/current-card.md](assets/current-card.md) only when the corresponding
private file does not exist; preserve useful existing notes. Never stage or
commit `.ai/` files.

## Break down the feature

1. Read repository instructions and the available PRD, Figma, domain docs, and
   relevant code. Treat confirmed decisions as fixed.
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
7. Select only one `Ready` card. Copy its context into `.ai/current-card.md`.
   The next implementation workflow is `dev-flow`; do not start it yourself.

Use `Proposed`, `Ready`, `In progress`, `Blocked`, and `Done` only as local
statuses. Update the board after the user confirms a changed plan or after a
card's status is known. Keep all skill-generated text, templates, and metadata
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
breakdown. Do not invoke `dev-flow`, `to-tickets`, or any implementation
workflow.

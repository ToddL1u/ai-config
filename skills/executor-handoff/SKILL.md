---
name: executor-handoff
description: Create a private, source-pinned implementation handoff for one Ready feature card when another agent will implement it. Use after feature-breakdown selects a Ready card and before the executor starts dev-flow; use when PRD and Figma references must remain authoritative rather than being approximated in prose.
---

# Executor Handoff

Turn one Ready feature card into a concise implementation packet for another
agent. Plan only; do not implement product code, create tickets, publish an
external artifact, or commit the handoff.

## Input and destination

Read repository instructions, `.ai/feature-board.md`, `.ai/current-card.md`,
the card's linked PRD and Figma references, relevant domain docs, and only the
repository code needed to name reusable patterns or likely entry points.

Require one card with status `Ready`. If its outcome, acceptance criteria,
dependencies, or source references are missing, stop and name the missing
input. Do not select a card or resolve a product decision yourself.

Create `.ai/executor-handoff.md` from
[assets/executor-handoff.md](assets/executor-handoff.md) only when it does not
exist. If it exists for the same card, update it while preserving useful
confirmed context. If it is for a different card, ask whether to replace it or
use a user-approved card-specific path.

Before creating the file, run `git rev-parse --git-path info/exclude`. Add the
exact line `.ai/` to that worktree's resulting exclude file when absent. Do not
edit shared `.gitignore`, stage, or commit `.ai/` files.

## Preserve source authority

Record each source with a stable reference:

- PRD: URL or path, version or date when available, and exact page section.
- Design: URL or path, exact frame or node, and revision or date when
  available.
- Repository: relevant instructions, design-system components, and established
  test conventions.

The PRD governs user behavior, business rules, copy, and analytics. The design
governs layout, typography, tokens, visual states, and responsive behavior.
Repository instructions and existing conventions govern implementation choices.
When sources conflict, report the conflict; do not silently choose one.

If a material source cannot be read, record its exact reference and access
failure in the handoff. The executor must stop before coding until the source
is available or the user explicitly accepts a replacement source.

## Write the handoff

Keep the brief scoped to the one Ready card. Map every acceptance criterion to
its governing source. Include known loading, empty, error, permission, and
responsive states only when the sources require them; do not invent design or
product decisions.

State reusable repository components or patterns as things to inspect, not as
assumptions that they already satisfy the requirement. Include a copyable
executor prompt that tells the next agent to re-open the source references,
inspect the repository before editing, use `dev-flow`, and stop on a material
source conflict or access failure.

## Handoff

Report the handoff path, card identity, source references, access status, and
any blocking conflict or unanswered question. End after writing the handoff.
Do not invoke `dev-flow` or implementation.

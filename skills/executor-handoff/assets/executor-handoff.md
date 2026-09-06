# Executor handoff

## Identity

- Card:
- Parent Epic:
- Board: `.ai/feature-board.md`
- Generated:

## Source of truth

| Source | Stable reference and version | Governs | Access status |
| --- | --- | --- | --- |
| PRD |  | Behavior, business rules, copy, and analytics |  |
| Design |  | Layout, tokens, visual states, and responsive behavior |  |
| Repository |  | Implementation conventions, reusable components, and tests |  |

### Source conflict policy

- PRD governs behavior and business rules.
- Design governs visual details and interaction presentation.
- Repository instructions govern implementation choices.
- Stop and report any material conflict or unavailable source before coding.

## Outcome


## Scope and non-goals

- Scope:
- Non-goals:

## Requirements trace

| Requirement or acceptance criterion | Governing source | Verification |
| --- | --- | --- |
|  |  |  |

## Design and behavior notes

- Reusable patterns or components to inspect:
- Required states:
- Responsive and accessibility requirements:

## Dependencies and boundaries

- Dependencies:
- Mock-first boundary:
- Assumptions:
- Open questions:

## Executor prompt

```text
Read .ai/executor-handoff.md and .ai/current-card.md. Re-open every listed source of truth, then inspect the relevant repository code before editing. Treat the PRD as authoritative for behavior and the design source as authoritative for visual details. If a material source is unavailable or conflicts with another source, stop and report the exact reference and conflict. Otherwise, use dev-flow to implement only this card, run the listed verification, and summarize the diff without unrelated refactors.
```

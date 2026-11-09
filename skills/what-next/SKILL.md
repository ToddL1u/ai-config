---
name: what-next
description: Recommend the single next skill for your current situation, without taking action.
disable-model-invocation: true
---

# What Next?

Act as a read-only workflow compass. Recommend one next skill, explain why, and
show only the likely path that follows.

Do not invoke another skill, edit files, create tickets, delegate agents, or
continue into execution. The user chooses whether to invoke the recommendation.

## Decide

Use the user's stated situation and available conversation context. Ask one
short question only when two materially different routes remain plausible.

Prefer these routes:

- Product viability, MVP scope, or build-plan question → `mvp-plan`.
- Unresolved non-code plan or design → `grill-me`.
- Unresolved feature or architecture in an existing repository →
  `grill-with-docs`.
- Terminology, domain boundaries, glossary, or ADR problem specifically →
  `domain-modeling`.
- Resolved idea with no written requirements (no PRD, spec, or ticket) →
  `to-spec`.
- Resolved requirements (approved spec, PRD and Figma, ticket, or settled
  discussion) that need vertical slices, or a feature board that must be synced
  with the code → `to-tickets`.
- Ready board card that another agent will implement from PRD and design
  sources → `executor-handoff`.
- Selected board card, approved single-slice spec, or resolved change small
  enough for one implementation flow → `dev-flow`.
- Approved Jira ticket without a prepared ticket branch → `start-ticket`.
- Approved ticket on its prepared branch → `dev-flow`.
- Hard, intermittent, or poorly reproduced defect → `debug`.
- One concrete behavior to build or fix test-first → `tdd`.
- Read-only code-flow or dependency investigation → `understand-feature`.
- Running web application needs visual, interaction, console, responsive, or
  accessibility verification → `qa-browser`.
- Implemented work needs an independent pre-landing review → `review-sweep`.
- Uncommitted work needs logical, user-approved commits → `commit-chunk`.
- Finished, committed feature branch needs tests, review, changelog, and PR →
  `ship`.
- Only a PR description or PR creation is requested → `pr`.
- Feature branch must merge into UAT → `uat-merge`.
- Supported frontend repository must deploy to UAT → `deploy-uat`.
- Save session context, or resume from a saved brief → `handover`.
- Finished session whose friction should improve skills or setup → `retro`.

Do not recommend internal coordination or review skills such as
`parallel-work`, `spec-review`, or `standards-review`; their controlling
workflows own them. Do not route to unrelated personal utilities.

## Main flow

Use this as orientation, not an automatic pipeline:

```text
grill-with-docs → to-spec → to-tickets → dev-flow → review-sweep → ship → retro
```

Skip `to-spec` when a PRD and Figma or an approved ticket already define the
requirements. Run `start-ticket` before `dev-flow` on a Jira ticket.
`review-sweep` runs inside `dev-flow`. Around `ship`: `commit-chunk` before it,
`uat-merge` and `deploy-uat` after it where UAT applies. `dev-flow` builds one
card per run.

For a small resolved change, go directly to `dev-flow`. For a hard bug, enter
through `debug`; for understanding only, enter through `understand-feature`.

## Respond

Default to:

```markdown
Next: `<skill>`

Why: <one or two sentences tied to the user's current state>

Likely path: `<skill>` → `<next likely skill>` → ...
```

Keep the likely path short and mark conditional steps. Do not present several
equally weighted recommendations.

If the user explicitly requests the complete map, show the relevant routes
grouped under Clarify, Plan, Build, Understand / Verify, Finish, and Preserve
Context. Include one-line entry conditions, not full skill documentation.

Adapted from Matt Pocock's
[ask-matt](https://github.com/mattpocock/skills/tree/main/skills/engineering/ask-matt)
skill.

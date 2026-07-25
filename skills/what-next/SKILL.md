---
name: what-next
description: Recommend the single next local engineering or software-delivery skill for the user's current situation without taking action. Use only when the user explicitly invokes what-next, asks which workflow or skill to use, asks what comes next, or requests the complete engineering workflow map.
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
- Resolved feature small enough for one implementation flow → `dev-flow`.
- Resolved multi-session feature without an approved spec → `to-spec`.
- Approved multi-slice spec → `to-tickets`.
- Approved single-slice spec → `dev-flow`.
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
- Save a lightweight resumable project snapshot → `checkpoint`.
- Transfer dense context into a fresh session → `handover`.

Do not recommend internal coordination or review skills such as
`parallel-work`, `spec-review`, or `standards-review`; their controlling
workflows own them. Do not route to unrelated personal utilities.

## Main flow

Use this as orientation, not an automatic pipeline:

```text
unclear repository change
  → grill-with-docs
  → to-spec                    when the build spans sessions
  → to-tickets                 when the spec needs multiple slices
  → start-ticket               when starting an approved Jira ticket
  → dev-flow
  → ship
```

For a small resolved change, go directly to `dev-flow`. It already composes TDD
and final review. For a hard bug, enter through `debug`; for understanding only,
enter through `understand-feature`.

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

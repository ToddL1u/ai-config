---
name: grill-with-docs
description: Start an explicit grilling session that stress-tests a plan against the repository's domain language and records confirmed glossary or architecture decisions incrementally. Use only when the user invokes grill-with-docs or directly asks for a grilling session that maintains domain documentation.
---

# Grill With Docs

Run a repository-aware feature intake, then use `grilling` with the
`domain-modeling` discipline only for material unresolved decisions.

## Feature Intake

Before asking any question, inspect the repository instructions, relevant PRD
and Figma sources, existing behavior, code, tests, glossary, context map, and
architecture decision records. Investigate discoverable facts instead of asking
the user.

Return a concise **Feature Start Brief** containing:

- user problem, user-visible outcome, and explicit non-goals;
- stable source references and unavailable-source blockers;
- confirmed facts, safe assumptions, and dependencies;
- material decisions requiring user confirmation;
- the smallest independently verifiable vertical slice;
- acceptance and verification criteria;
- recommended next route: `dev-flow` for one resolved slice, or
  `feature-breakdown` for a large or dependent feature.

Treat a decision as material only when it could change user behavior, scope,
authorization, data interpretation, an external contract, acceptance criteria,
or testing seams.

If no material decision remains, return the Feature Start Brief and route
recommendation. Do not start `grilling` or invoke the downstream workflow.

## Decision Clarification

During the session:

- ask one decision question at a time;
- include a recommended answer and its main trade-off;
- investigate discoverable facts instead of asking the user;
- update the established domain documentation immediately after each relevant
  decision is confirmed;
- leave every incremental update coherent if the session stops there.

If the repository has no clear glossary or ADR convention, stop and ask once
where that documentation belongs before the first write. Do not invent a
default location.

Do not change code, implement the plan, publish external artifacts, or invoke a
downstream workflow.

Finish with the `grilling` handoff plus:

- exact documentation files changed and what each captured;
- confirmed terms or ADR candidates not written, with the reason.

Then stop. The user chooses whether and when to invoke the next skill.

Adapted from Matt Pocock's
[grill-with-docs](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)
skill.

---
name: grill-with-docs
description: Start an explicit grilling session that stress-tests a plan against the repository's domain language and records confirmed glossary or architecture decisions incrementally. Use only when the user invokes grill-with-docs or directly asks for a grilling session that maintains domain documentation.
---

# Grill With Docs

Run `grilling` with the `domain-modeling` discipline in documentation mode.

Before asking about facts, inspect the repository, its instructions, its code,
and any existing glossary, context map, or architecture decision records.

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

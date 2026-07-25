---
name: domain-modeling
description: Analyze and sharpen a project's domain language, boundaries, and durable architecture decisions. Use when terminology is vague or conflicting, domain relationships need stress-testing, a glossary or ADR may need maintenance, or another skill needs domain-modeling discipline. Automatic use may suggest documentation changes but must not write them.
---

# Domain Modeling

Actively sharpen the project's domain model. Challenge terminology, test
boundaries with concrete scenarios, and compare stated behavior with the code.
Merely reading domain documentation for vocabulary is not this skill.

## Choose the operating mode

Use **analysis mode** when invoked automatically or while supporting a general
task:

- read existing domain documentation;
- surface terminology conflicts and propose canonical terms;
- identify possible ADRs;
- do not edit documentation.

Use **documentation mode** only when the user explicitly requests domain
documentation changes or when `grill-with-docs` invokes this discipline:

- record each confirmed glossary or architecture decision incrementally;
- leave every write coherent if the session stops immediately afterward.

## Locate the domain documentation

Inspect repository instructions and existing conventions first. Look for
glossaries such as `CONTEXT.md`, context maps such as `CONTEXT-MAP.md`, and
existing ADR directories or indexes.

If the established location and format are clear, follow them. In a
multi-context repository, use its context map and place a decision in the
context that owns it. Ask when ownership is ambiguous.

If no convention exists or several locations are equally plausible, stop and
ask once where glossary and ADR documentation belongs before writing. Do not
create `CONTEXT.md`, `CONTEXT-MAP.md`, or an ADR directory by assumption.

## Sharpen the model

- Call out conflicts with the established glossary immediately.
- Replace vague or overloaded language with a proposed canonical term.
- Invent concrete edge cases that expose unclear relationships or boundaries.
- Check claims about current behavior against the code when possible.
- Surface contradictions for the user to resolve; do not silently choose.

## Maintain the glossary

In documentation mode, update the glossary as soon as a term is confirmed.
Follow the repository's format, or
[references/CONTEXT-FORMAT.md](references/CONTEXT-FORMAT.md) when the user has
chosen that format.

Keep the glossary limited to stable, project-specific domain language. It is
not a feature specification, scratchpad, implementation guide, or decision
log. Do not copy feature requirements into it.

## Maintain architecture decisions

Offer an ADR only when all three conditions hold:

1. The decision is meaningfully difficult to reverse.
2. The choice would be surprising without its context.
3. The decision resolves a genuine trade-off between alternatives.

If any condition is missing, do not create an ADR. In documentation mode,
follow the repository's convention, or
[references/ADR-FORMAT.md](references/ADR-FORMAT.md) when the user has chosen
that format.

After writing documentation, report the exact files changed and what was
captured. Do not change code or invoke a downstream workflow.

Adapted from Matt Pocock's
[domain-modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling)
skill.

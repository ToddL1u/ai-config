# Domain Glossary Format

Use this format only when the repository has adopted it.

```md
# {Context Name}

{One or two sentences describing the context and why it exists.}

## Language

**Order**: {A one- or two-sentence definition.}
_Avoid_: Purchase, transaction

**Customer**: {A one- or two-sentence definition.}
_Avoid_: Client, buyer, account
```

## Rules

- Pick one canonical term and list meaningful alternatives under `_Avoid_`.
- Define what a term is in one or two sentences, not how it is implemented.
- Include only stable concepts specific to the project's domain.
- Exclude feature requirements, implementation details, and general
  programming concepts.
- Group terms only when natural clusters have emerged.

For multiple contexts, follow the repository's existing context map. If
ownership or the destination is unclear, ask once before writing.

Adapted from Matt Pocock's
[CONTEXT-FORMAT.md](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/CONTEXT-FORMAT.md).

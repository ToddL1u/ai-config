---
name: to-tickets
description: Break one named, approved specification into dependency-aware tracer-bullet tickets, preview the complete ticket graph, and publish it idempotently to one approved destination. Use only when the user explicitly invokes to-tickets or asks to turn an approved spec into executable tickets.
---

# To Tickets

Turn one approved specification into a directed acyclic graph of executable
vertical slices. Produce the ticket set; do not decide when or how agents run
it.

## Validate the source and destination

Require a stable specification reference and version. Read the full artifact
and confirm that its status is `Approved`. If the reference, version, approval
status, or material requirement is missing, stop without drafting tickets.

Read relevant repository instructions, domain documentation, ADRs, code, and
tests. Use the spec as the authoritative source of feature requirements; do not
rewrite, broaden, close, or modify it.

Choose exactly one publication destination:

- one repository ticket-set file using an established or user-approved path; or
- one named issue tracker project.

If neither the request nor repository convention selects exactly one, ask one
operational question before drafting. Never publish a fallback copy elsewhere.

## Draft tracer-bullet tickets

Give each ticket a stable draft key such as `T1`, `T2`, and preserve those keys
across revisions and publication retries.

Each ticket must:

- deliver a narrow, complete, user-observable or independently verifiable path;
- fit in one fresh context window;
- state what it delivers without a layer-by-layer implementation list;
- include observable acceptance criteria and verification expectations;
- reference the exact source spec and version;
- list only blockers that genuinely prevent it from starting;
- avoid copying the full specification.

Prefer vertical slices through the necessary layers. Do not create separate
schema, backend, frontend, and testing tickets for one behavior.

A wide mechanical refactor that cannot land green as a vertical slice is the
exception. Express it as expand, bounded migration batches, then contract.
Block contract on every migration batch. Do not add speculative prefactoring.

Use this ticket body:

```md
## Approval

Status: Proposed

## Source spec

{stable reference} @ {approved version}

## Ticket key

{stable draft key}

## What to build

{The complete behavior this slice delivers.}

## Acceptance criteria

- [ ] {Observable criterion}

## Verification

- {How completion is proved}

## Blocked by

- {ticket key and title, or `None — can start immediately`}
```

## Validate and preview the graph

Check before presenting the draft:

- every blocker references a ticket in this draft or an explicitly named
  existing dependency;
- the graph has no cycles;
- at least one ticket is immediately actionable;
- tickets appear in topological order, blockers before dependants;
- every spec requirement is covered exactly once or intentionally shared;
- no ticket expands beyond the approved spec.

Show the exact destination, numbered graph, and complete ticket bodies. Ask one
approval question covering the shown content, target, and blocker edges. If any
of them changes, show the revised draft and obtain fresh approval.

Approval permits only mechanical publication metadata: change each ticket's
status from `Proposed` to `Approved`, add the approval date, and record its real
tracker identifier.

Obtain approval in the current invocation after showing the preview. An
existing ticket file, prior publication, tracker status, or approval from an
earlier session is not approval for a new write. If the selected destination
already contains the exact approved result and no write is needed, verify it
and report a no-op; otherwise, do not create or update anything before current
approval.

## Publish idempotently

After approval, use `{source spec reference} + {spec version} + {ticket key}` as
the stable publication fingerprint.

For a repository destination, create or update only the approved ticket-set
file. Keep tickets in topological order, record each ticket's approved status
and approval date, and preserve blocker references by stable key. Do not commit
unless separately requested.

For an issue tracker:

1. Search the selected project for each fingerprint and reuse an exact match.
2. Create only missing tickets in topological order, recording each real ID.
3. Add native blocking relationships between the published child tickets when
   available; otherwise write the real references into `Blocked by`. Reference
   the source spec in the body only; do not create or change a parent
   relationship.
4. Re-read the published tickets and verify approved status, bodies, source
   spec identity, and edges.

Never create a second ticket for an existing fingerprint. If publication fails
partway, do not roll back or restart. Report the created and reused mappings,
the first failed operation, and the uncreated tickets or missing edges so a
retry can resume safely.

Do not close, relabel, or modify the source spec or parent issue.

Report the canonical ticket-set reference, spec version, published
key-to-identifier mapping, and current frontier. Then stop. Do not invoke
`start-ticket`, `dev-flow`, or another downstream workflow.

Adapted from Matt Pocock's historical
[to-tickets](https://github.com/mattpocock/skills/blob/386d4ff/skills/engineering/to-tickets/SKILL.md)
skill.

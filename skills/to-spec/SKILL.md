---
name: to-spec
description: Synthesize resolved conversation context and repository evidence into a concise, testable feature specification, then publish it to one approved destination. Use only when the user explicitly invokes to-spec or asks to turn an already-resolved discussion into a specification or PRD.
---

# To Spec

Turn the current resolved context into one authoritative feature specification.
Do not conduct a product interview or reopen confirmed decisions.

## Establish the source and destination

Read the conversation, any grilling handoff, repository instructions, relevant
domain documentation, ADRs, code, and tests. Use established domain language
and distinguish current behavior from proposed behavior.

If a material decision is unresolved, stop and list the missing decisions.
Treat a question as material when its answer could change user-visible
behavior, authorization, data interpretation, an external contract, acceptance
criteria, or the testing seams. Recommend a separate grilling session, but do
not invoke it.

Choose exactly one canonical publication destination for this run:

- a repository specification file; or
- one issue or page in the user's named tracker.

Use an explicitly named destination or an unambiguous repository convention.
If neither selects exactly one destination, ask one operational question before
drafting. Do not publish the same spec to a fallback or second destination.

## Draft the specification

Prefer concise, observable requirements over an exhaustive user-story
inventory. Include only user stories that describe distinct behavior.

Identify the highest stable testing seams that can prove the feature. Prefer
existing seams over new ones and external behavior over implementation detail.
Include proposed seams in the draft rather than starting a separate interview.

Before previewing the draft, run a completeness gate. An approvable spec must
contain no material open question and must not defer one to implementation or
"existing conventions" that were not found. Low-risk delivery notes may remain
under Risks and open questions.

Use this structure:

```md
# {Feature title}

Status: Proposed
Version: {version or date}

## Problem
{The user-visible problem and relevant current behavior.}

## Goals and success measures
- {Observable outcome}

## Non-goals
- {Explicit exclusion}

## Required behavior
- {Behavior and acceptance criteria}

## Solution outline
{The agreed product and technical shape without brittle file-level detail.}

## Domain and architecture constraints
- {Relevant glossary terms, ADRs, contracts, compatibility, or safety limits}

## Testing decisions
- {Test seam, behavior proved, and relevant prior art}

## Risks and open questions
- {Known risk, or `None`}
```

Do not invent missing requirements. Do not include implementation file paths or
large code samples unless a small prototype-derived shape expresses a confirmed
decision more precisely than prose.

## Approve and publish

Show the complete draft and exact destination before any write. Ask one
approval question: whether to publish that draft to that destination.

Approval covers only the shown content and target, plus mechanical publication
metadata such as changing `Status` to `Approved`, adding the approval date, or
recording the tracker ID. If the content or target changes, show the revised
draft and obtain fresh approval.

After approval:

- create or update only the selected canonical artifact;
- preserve its stable path or tracker identity on later updates;
- do not commit repository files unless separately requested;
- if publication fails or the required capability is unavailable, report the
  failure and stop without publishing elsewhere.

Report the canonical reference, approved version, and destination. Then stop.
Do not invoke `to-tickets`, `dev-flow`, or another downstream workflow.

Adapted from Matt Pocock's historical
[to-spec](https://github.com/mattpocock/skills/blob/386d4ff/skills/engineering/to-spec/SKILL.md)
skill.

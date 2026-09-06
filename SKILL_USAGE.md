# Skill Usage Guide

This guide covers the local skills in `skills/`. It does not cover bundled or
connected-app skills supplied by Codex plugins.

## Start here

Use `what-next` when you know your situation but do not know the workflow:

```text
Use what-next. I have an approved Jira ticket, I am still on main, and I want
to start implementing it. What should I use next?
```

You do **not** need to provide every requirement. A useful minimum is:

```text
Current state + desired outcome + relevant artifact or constraint
```

For example:

```text
Use what-next. The feature is implemented and tests pass, but it has not been
reviewed or committed.
```

`what-next` recommends one immediate skill and a short likely path. It does not
run the recommendation. If you already know the operation you need, invoke that
skill directly.

## Main engineering flow

```text
unclear repository change
  → grill-with-docs
  → feature-breakdown          when the feature has dependent vertical slices
  → executor-handoff           when another agent will implement a Ready card
  → to-spec                    when a shared approved specification is needed
  → to-tickets                 when approved tracker tickets are needed
  → start-ticket               when starting an approved Jira ticket
  → dev-flow
  → commit-chunk               when completed changes are uncommitted
  → ship
```

Small, resolved changes can enter at `dev-flow`. Hard bugs enter at `debug`.
Read-only investigations enter at `understand-feature`.

## Choose, clarify, and design

### `what-next`

- **Use when:** You are unsure which engineering or delivery skill fits the
  current situation, or you want the complete workflow map.
- **Prompt:** `Use what-next. I have an approved multi-slice spec but no tickets yet. What comes next?`
- **Note:** Default entry point when unsure. It advises only and takes no action.

### `mvp-plan`

- **Use when:** You have a product idea, side project, AI feature, or MVP whose
  value and scope still need evaluation.
- **Prompt:** `Use mvp-plan. Scope an MVP for an AI assistant that summarizes customer calls.`

### `grill-me`

- **Use when:** You want a one-question-at-a-time stress test of a non-code plan
  or design.
- **Prompt:** `Use grill-me. Grill my plan for launching a paid newsletter.`

### `grill-with-docs`

- **Use when:** A repository change is still ambiguous and confirmed domain or
  architecture decisions should be recorded incrementally.
- **Prompt:** `Use grill-with-docs. Help me resolve the reminder rules for this checkout repository.`

### `grilling`

- **Use when:** Another workflow needs the reusable one-decision-at-a-time
  interview discipline.
- **Prompt:** `Use grilling to challenge this migration plan one decision at a time.`
- **Note:** Usually composed by `grill-me` or `grill-with-docs`.

### `domain-modeling`

- **Use when:** Terms are vague or overloaded, domain boundaries need
  stress-testing, or a glossary or ADR needs attention.
- **Prompt:** `Use domain-modeling. We use "account" for customers, billing profiles, and login identities; help us separate the concepts.`

### `design-review`

- **Use when:** You want architecture feedback, scalability trade-offs, system
  design practice, or interview preparation.
- **Prompt:** `Use design-review. Review my design for a multi-region notification service.`

## Plan, understand, and start

### `to-spec`

- **Use when:** The discussion is already resolved and should become one
  authoritative, testable specification.
- **Prompt:** `Use to-spec. Turn our resolved reminder-flow discussion into an approved local spec.`
- **Note:** It synthesizes; it does not reopen the interview.

### `to-tickets`

- **Use when:** One approved specification needs dependency-aware,
  independently verifiable implementation tickets.
- **Prompt:** `Use to-tickets. Split docs/reminder-spec.md into tracer-bullet Jira tickets.`

### `feature-breakdown`

- **Use when:** A large feature has incomplete PRD or Figma decisions, multiple
  user-observable slices, or dependencies that make one `dev-flow` too broad.
- **Prompt:** `Use feature-breakdown. Map this Figma and PRD into private, dependency-aware vertical slices.`
- **Note:** It creates private `.ai/feature-board.md` and `.ai/current-card.md`; it does not implement or create tracker tickets.

### `executor-handoff`

- **Use when:** One `feature-breakdown` card is Ready and another agent should
  implement it from the original PRD and Figma sources.
- **Prompt:** `Use executor-handoff. Create a handoff for C2 for Claude Code using the linked PRD and Figma frame.`
- **Note:** It creates a source-pinned private brief and stops before implementation.

### `start-ticket`

- **Use when:** An approved Jira ticket is ready and you need to fetch it,
  prepare the repository, and create its branch.
- **Prompt:** `Use start-ticket for SPF-482.`

### `understand-feature`

- **Use when:** You need a read-only trace of behavior, entry points,
  dependencies, or risks before editing.
- **Prompt:** `Use understand-feature. Trace how checkout completion triggers customer notifications.`

## Build, debug, and test

### `dev-flow`

- **Use when:** You want a feature, approved spec, or prepared ticket
  implemented through inspect, plan, TDD, verification, and final review.
- **Prompt:** `Use dev-flow. Implement the approved ticket SPF-482 from its current branch.`
- **Note:** This is the default implementation workflow. It composes
  `test-impact`, `tdd`, and `review-sweep` when appropriate.

### `debug`

- **Use when:** A bug is intermittent, poorly reproduced, multi-file, or needs
  disciplined root-cause diagnosis.
- **Prompt:** `Use debug. A payment callback fails intermittently in production and we have no reliable reproduction.`

### `test-impact`

- **Use when:** You need to discover existing coverage and choose a stable
  public test seam before implementation.
- **Prompt:** `Use test-impact. Where should we test the new checkout reminder behavior?`
- **Note:** Often composed by `dev-flow` for raw requests.

### `tdd`

- **Use when:** One concrete behavior should be built or fixed through focused
  red-green-cleanup cycles at an approved seam.
- **Prompt:** `Use tdd. Add the rule that opted-out customers never receive reminder emails.`

## Verify and review

### `qa-browser`

- **Use when:** A running web application needs visual, interaction,
  responsive, console, or accessibility verification.
- **Prompt:** `Use qa-browser. Verify the checkout page at http://localhost:3000 on desktop and mobile.`
- **Note:** Review is read-only unless you explicitly request fix mode.

### `review-sweep`

- **Use when:** Implemented work needs an independent specification and
  engineering-standards review before landing.
- **Prompt:** `Use review-sweep. Review the current uncommitted feature from the HEAD recorded before implementation.`
- **Note:** The review layer is always read-only.

### `spec-review`

- **Use when:** The review orchestrator needs an isolated comparison between a
  frozen change bundle and its authoritative specification.
- **Prompt:** `Use spec-review on this frozen bundle and approved spec version.`
- **Note:** Internal review axis. Normally invoke `review-sweep`, not this skill.

### `standards-review`

- **Use when:** The review orchestrator needs an isolated engineering-risk and
  repository-standards review of a frozen bundle.
- **Prompt:** `Use standards-review on this frozen bundle and these repository instructions.`
- **Note:** Internal review axis. Normally invoke `review-sweep`, not this skill.

## Commit, publish, and deploy

### `commit-chunk`

- **Use when:** Uncommitted changes should be divided into logical, buildable
  commits and each proposed chunk reviewed before committing.
- **Prompt:** `Use commit-chunk. Organize the current changes into a clean commit sequence.`

### `pr`

- **Use when:** You only need a pull-request description, template, or PR
  creation from the current branch.
- **Prompt:** `Use pr. Draft a PR description against develop, but do not create it yet.`

### `ship`

- **Use when:** A finished, committed feature branch should run tests and
  review, update the changelog when applicable, and create a PR.
- **Prompt:** `Use ship. Take this completed feature branch to a ready pull request.`

### `uat-merge`

- **Use when:** A feature branch must be safely merged into UAT with explicit
  conflict decisions and confirmation before pushing.
- **Prompt:** `Use uat-merge. Merge the current feature branch into uat.`

### `deploy-uat`

- **Use when:** An allowed frontend repository and country set should be
  deployed to UAT through Jenkins.
- **Prompt:** `Use deploy-uat. Deploy the checkout frontend for TW to UAT.`

## Coordinate and preserve context

### `parallel-work`

- **Use when:** A controlling workflow or request contains at least two
  independent, bounded tasks whose parallel execution provides meaningful
  benefit.
- **Prompt:** `Use parallel agents to inspect the frontend, API, and test impact independently, then combine the evidence.`
- **Note:** Internal coordination discipline. You normally describe the desired
  parallel work instead of invoking the skill by name. It never chooses the
  surrounding workflow.

### `checkpoint`

- **Use when:** You want a lightweight save, resume, or list operation for
  project-local work state.
- **Prompt:** `Use checkpoint to save the current authentication refactor state.`
- **Prompt:** `Use checkpoint resume.`

### `handover`

- **Use when:** Dense context must move into a fresh session without losing
  decisions, blockers, or next steps.
- **Prompt:** `Use handover to save this session for a fresh task.`
- **Prompt:** `Use handover load to resume the saved brief.`

### `journal`

- **Use when:** You want a dated development journal entry based on branch
  history and optional notes.
- **Prompt:** `Use journal. Record today's work and note that the API contract is still blocked.`

## Communication, knowledge, and personal workflows

### `caveman`

- **Use when:** You want highly compressed communication while preserving
  technical accuracy.
- **Prompt:** `Use caveman mode for the rest of this explanation.`
- **Note:** Say `stop caveman` to return to normal prose.

### `caveman-compress`

- **Use when:** A Markdown instruction or memory file should be compressed to
  reduce input tokens.
- **Prompt:** `Use caveman-compress on /absolute/path/to/AGENTS.md.`
- **Note:** It creates a human-readable backup, then overwrites the original
  with the compressed version.

### `english-learn`

- **Use when:** You want vocabulary and phrases extracted from an English
  article, video, or podcast and saved to Notion.
- **Prompt:** `Use english-learn on https://example.com/article, focusing on business vocabulary.`

### `notion-add`

- **Use when:** You explicitly want to create or update a Notion page or
  database record.
- **Prompt:** `Use notion-add. Save this decision summary to my Engineering Wiki database.`

### `daily-digest-cloud`

- **Use when:** You want to build or publish the Traditional Chinese Daily
  Digest from the cloud-accessible Notion sources.
- **Prompt:** `Use daily-digest-cloud for today's digest and publish it after duplicate checking.`

### `peer-review`

- **Use when:** You need help completing quarterly or Lattice peer reviews,
  interviewing for evidence, and polishing comments.
- **Prompt:** `Use peer-review. Help me complete my unfinished Lattice reviews for this quarter.`

### `skincare-consultant`

- **Use when:** You want a product, ingredient list, routine, skin profile, or
  owned inventory evaluated for fit, overlap, and irritation risk.
- **Prompt:** `Use skincare-consultant. Review this product URL against my current evening routine.`

## Local system helpers

### `connect-vpn`

- **Use when:** You need the company VPN connected through Tunnelblick, or a
  private-network operation failed because the VPN is off.
- **Prompt:** `Use connect-vpn.`

### `memcheck`

- **Use when:** Your Mac is slow and you want to inspect memory and CPU usage,
  then optionally choose a heavy process to stop.
- **Prompt:** `Use memcheck. Show what is consuming memory, but ask before killing anything.`

## Quick selection rules

- Unsure where to begin → `what-next`
- Unclear repository idea → `grill-with-docs`
- Large private feature with dependent slices → `feature-breakdown`
- Ready card for another agent → `executor-handoff`
- Resolved multi-session work → `to-spec`
- Approved multi-slice spec → `to-tickets`
- Approved Jira ticket, no branch → `start-ticket`
- Ready to implement → `dev-flow`
- Hard unreproduced bug → `debug`
- Need to understand only → `understand-feature`
- Need browser evidence → `qa-browser`
- Implementation needs review → `review-sweep`
- Completed changes need commits → `commit-chunk`
- Clean completed branch needs a PR → `ship`
- Need a fresh session → `handover`

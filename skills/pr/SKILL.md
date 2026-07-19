---
name: pr
description: Generate a GitHub pull request description from the current branch, optionally copy it, or create the PR. Use when the user asks to fill a PR template, draft or copy a PR description, summarize branch changes for review, or create a pull request. Supports explicit base branches and local-unpushed-change summaries.
---

# PR

Generate an accurate PR description from the repository's template and the
actual diff against the intended base branch.

## Modes

- **Draft** (default): render the filled template without publishing anything.
- **Copy** (`--copy` or an explicit request to copy the body): render the draft
  and copy the exact body to the local clipboard.
- **Create** (`--create` or an explicit request to create/open the PR): show the
  final title, base, head, and body, then create the PR.
- **Local unpushed** (`--local-unpushed`): summarize commits and changes in
  `origin/<current-branch>..HEAD`. This means local commits not yet on the
  tracked remote branch; do not describe them as previously pushed commits.
- **Base override** (`--base=<branch>`): compare against and target that branch.

Do not try to infer "commits from the latest push" from Git history alone. Git
does not retain a reliable boundary for the previous push.

## Workflow

### 1. Resolve head and base

1. Read the current branch with `git branch --show-current`. Stop on a detached
   HEAD or a protected branch unless the user explicitly explains the workflow.
2. Resolve the base in this order:
   - `--base=<branch>` supplied by the user;
   - existing PR base from `gh pr view --json baseRefName`;
   - repository default from `refs/remotes/origin/HEAD`;
   - ask the user when the base remains ambiguous.
3. Verify `origin/<base>` exists after a read-only `git fetch origin <base>`.
4. Use the same resolved base for diff generation and PR creation. Never
   analyze against `master` and then create the PR against `uat`.

### 2. Gather the exact scope

For a full branch draft, inspect:

```bash
git log "origin/<base>..HEAD" --pretty=format:"%h %s"
git diff "origin/<base>...HEAD" --stat
git diff "origin/<base>...HEAD"
```

For `--local-unpushed`, require a tracked remote branch and inspect:

```bash
git log "@{upstream}..HEAD" --pretty=format:"%h %s"
git diff "@{upstream}..HEAD" --stat
git diff "@{upstream}..HEAD"
```

If the selected range is empty, report that there is nothing to describe and
stop. For a diff larger than 2,000 lines, inspect the stat, commits, and changed
files first, then open only the relevant sections instead of loading the entire
diff at once.

### 3. Read repository conventions

Use `.github/pull_request_template.md` when present and preserve its exact
section order and checklist wording. If it is absent, use sections for Summary,
Type of Change, Test Steps, References, Root Cause, Limitations, and Checklist.

Infer Jira keys from the branch and commits using `UPPERCASE-123`. For `SPF-*`,
link to `https://sportygroup.atlassian.net/browse/<KEY>`. Do not invent a Jira
link when no key exists.

### 4. Draft the content

Create:

- a 2–5 sentence summary covering motivation, behavior, and approach;
- 3–6 concrete TL;DR bullets;
- numbered verification steps based on changed behavior, including important
  failure or boundary cases;
- root cause and limitations for bug fixes, otherwise `N/A` when required by
  the template;
- checklist states supported by evidence from the diff. Leave an item unchecked
  when evidence is missing; never check tests merely because a test file exists.

Show the resolved base and scope above the draft so the user can verify what was
analyzed.

### 5. Copy or create only when authorized

In Draft mode, return the filled template and stop.

In Copy mode, return the filled template, copy the same content with `pbcopy`,
and confirm the copy only if the command succeeds.

In Create mode:

1. Show the proposed title, head, base, and final body.
2. Treat the user's explicit request to create the PR as publication authority;
   ask only when the title, base, or scope is unresolved.
3. Run `gh pr create --base <base> --head <head> --title <title> --body <body>`.
4. Return the PR URL. If creation fails, report the error and retain the body in
   the response. Do not silently switch to another base or claim success.

## Invariants

- Use one base consistently for commits, diff, summary, and PR creation.
- Never push, force-push, or modify source files as part of this skill.
- Never fabricate tests, screenshots, ticket links, or checklist completion.
- Keep company-specific conventions subordinate to the repository's template.

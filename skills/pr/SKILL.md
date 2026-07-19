---
name: pr
description: Auto-fill GitHub PR template from current branch changes
---

# Fill PR Template Skill

Auto-fill the GitHub PR template (`.github/pull_request_template.md`) based on the current branch's git diff and commit history against master.

## Workflow

### Step 1: Ask scope preference

Before gathering context, ask the user:

> "Detailed (full branch) or pushed commits only?"

- **Detailed**: summarise the entire branch diff against master — all commits, all changed files.
- **Pushed commits only**: identify the commits that were pushed in the latest push (i.e. commits not yet in the remote before this push) and scope the summary, diff, and test steps to those commits only.

To detect pushed commits, run:
```bash
git log origin/{branch}..HEAD --pretty=format:"%h %s"
```
If this returns nothing, fall back to the last commit on the branch.

Wait for the user's answer before proceeding.

### Step 2: Gather branch context

Run the following git commands to collect all context:

```bash
git branch --show-current
git merge-base master HEAD
git log master..HEAD --pretty=format:"%h %s"
git diff master...HEAD --stat
git diff master...HEAD
```

For **pushed commits only** mode, replace the diff and log commands with the scoped range:
```bash
git log origin/{branch}..HEAD --pretty=format:"%h %s"
git diff origin/{branch}..HEAD --stat
git diff origin/{branch}..HEAD
```

If there are no commits ahead of master, inform the user and stop.

### Step 3: Extract Jira ticket

Parse the branch name for a Jira ticket ID. Branch names follow the pattern `{type}/{TICKET-ID}-description` (e.g. `feat/SPF-16068-mission-phase-7`).

- Extract ticket ID (e.g. `SPF-16068`) and construct Jira URL: `https://sportygroup.atlassian.net/browse/{TICKET-ID}`
- If multiple tickets appear across commit messages, collect all of them
- If no ticket is found, leave the reference section with "No Jira ticket found in branch name"

### Step 4: Detect type of change

Infer from the branch prefix and commit message prefixes:

| Branch prefix | Type |
|---|---|
| `feat/` | New feature |
| `fix/`, `hotfix/` | Bug fix |
| `refactor/` | Refactor |
| `docs/` | Documentation update |
| `breaking/` | Breaking change |

Also scan commit prefixes (`feat:`, `fix:`, `refactor:`, etc.) to confirm or supplement.

Mark the matching checkbox(es) in the "Type of change" section with `[x]`.

### Step 5: Generate summary

Analyze the diff and commit history to write the summary in two parts:

1. **Prose** (2-5 sentences): cover the why, business value, and high-level technical approach. Focus on motivation, not file names.
2. **TL;DR bullet list**: 3-6 concise bullets summarising the concrete changes made (what was added, removed, or modified). Each bullet should be specific enough that a reviewer knows what to look for in the diff.

Format:
```
{prose paragraph}

**TL;DR**
- {bullet 1}
- {bullet 2}
- ...
```

### Step 6: Generate test steps

Based on the affected modules/pages in the diff:
1. Identify the user-facing feature or page affected
2. Write numbered QA steps to verify the change
3. Include preconditions if needed (e.g. "Login as a user with active missions")
4. Cover both happy path and key edge cases

### Step 7: Fill root cause & limitation

- For **bugfix** branches (`fix/`, `hotfix/`): analyze the diff to describe the root cause and any limitations
- For **non-bugfix** branches: fill both sections with "N/A"

### Step 8: Fill checklist

Auto-check items based on diff analysis:
- **"Remove unnecessary console or comment"**: check `[x]` if no `console.log`, `console.warn`, `console.error`, or `console.debug` statements are added in the diff (ignore removals)
- **"Add unit tests"**: check `[x]` if test files (`.spec.ts`, `.test.ts`, `__test__/`) are included in the diff

### Step 9: Output filled template

Render the complete filled PR template as a markdown code block so the user can copy it. Use the exact structure from `.github/pull_request_template.md`.

Format:

~~~markdown
## Summary
{generated prose}

**TL;DR**
- {bullet 1}
- {bullet 2}
- ...

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update
- [ ] Refactor (no functionality changes)

## Screenshot(s)
<!-- Please attach screenshots -->

## Test Steps
{generated test steps}

## Reference Document(s)
- [{TICKET-ID}](https://sportygroup.atlassian.net/browse/{TICKET-ID})

## Root Cause (bugfix only)
{root cause or N/A}

## Limitation (bugfix only and if any)
{limitation or N/A}

## Checklist
- [x] Remove unnecessary console or comment
- [x] Add unit tests
~~~

### Step 10: Create PR via CLI

Ask the user:
> "Target branch? (default: `uat`)"

Use the user's answer, or `uat` if they confirm the default. Then run `gh pr create` with the filled template as the body and pass `--base {branch}`.

If `gh pr create` fails, fall back to copying the template to clipboard:

```bash
printf '%s' "<filled template content>" | pbcopy
```

Inform the user of the failure reason and that the template has been copied to their clipboard as a fallback.

### Step 11: Offer next actions

After the PR is created (or clipboard fallback):

1. **Create PR via CLI** — retry or create manually using the clipboard content
2. **Adjust** — modify any section before finalizing

### Step 12: After PR is created

Once the PR is created:
1. Output the PR link on its own line
2. Immediately ask **"What's next?"** — do not wait for the user to say "continue", "proceed", "y", etc.

## Edge Cases

- **No commits ahead of master**: Stop early with a message
- **No Jira ticket in branch name**: Leave reference as "No Jira ticket found" but still fill everything else
- **Very large diffs** (>2000 lines): Summarize from `--stat` and commit messages instead of full diff to avoid context overflow
- **Non-master base branch**: If the user specifies a different base, use that instead of master

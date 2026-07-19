---
name: start-ticket
description: Start a new Jira ticket — checks master branch, pulls latest, creates a branch from a Jira URL, and summarizes the ticket. Accepts an optional Jira URL or issue key as $ARGUMENTS; prompts interactively if not provided.
---

# start-ticket skill

You are helping the developer kick off work on a Jira ticket. Follow each step in order.

## Step 1 — Branch check

Run `git branch --show-current` to get the current branch.

If the current branch is NOT `master`:
- Tell the user the current branch name
- Ask: **"You're not on master. Switch to master to continue?"**
  - Options: "Yes, switch to master" / "No, stay on this branch"
- If yes: run `git checkout master`
- If no: abort and tell the user to re-run when ready

## Step 2 — Pull latest master

Run `git pull origin master` and report the result briefly (e.g. "Already up to date" or "Pulled X commits").

## Step 3 — Get the Jira ticket URL

If `$ARGUMENTS` contains a Jira URL or issue key (e.g. `SPF-123`, `https://...atlassian.net/...`), parse the issue key from it directly — skip the interactive prompt.

Otherwise ask the user: **"Paste the Jira ticket URL or issue key (e.g. SPF-123)."**

Parse the issue key from whatever they give you (URL or bare key). Inspect the
available capabilities for an authenticated Jira or Atlassian connector and use
it to fetch the issue. If none is available, explain that Jira access is
required and stop before changing branches.

Extract:
- **Issue key** (e.g. `SPF-123`)
- **Title** — strip any leading `FE - ` prefix (case-insensitive) from the summary
- **Description / acceptance criteria** — summarize in 3–5 bullets

## Step 4 — Choose branch prefix

Show the cleaned title to the user, then ask:

**"What prefix for this branch?"**
Options: `feat`, `fix`, `hotfix`, `chore`, `refactor`

## Step 5 — Create the branch

Build the branch name:
- Take the issue key and title
- **If the issue key prefix is `SPRTPLTFRM`, replace it with `SPF`** (e.g. `SPRTPLTFRM-12345` → `SPF-12345`)
- Convert the title to kebab-case (lowercase, spaces → hyphens, strip special chars)
- Format: `{prefix}/{ISSUE-KEY}-{kebab-title}`
- Example: `feat/SPF-123-add-login-screen`

Run `git checkout -b {branch-name}` and confirm to the user.

## Step 6 — Ticket summary & extra context

Print a summary block:

```
Ticket: {ISSUE-KEY} — {original title}
Branch: {branch-name}

What this ticket is about:
• ...
• ...
• ...
```

Then ask: **"Anything else to add? (extra context, related links, design notes — or press Enter to skip)"**

If they add content, acknowledge it and keep it in context for the session.

## Done

Tell the user they're ready to start coding.

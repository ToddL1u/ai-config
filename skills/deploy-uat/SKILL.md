---
name: deploy-uat
description: Deploy frontend projects to UAT through the Jenkins API. Supports multiple repositories and optional country and repository arguments. Use when the user asks to deploy UAT or deploy a frontend repository to UAT.
---

# Deploy UAT

Trigger frontend UAT deployment via Jenkins API with build status polling and macOS notification.

## Arguments

- `$ARGUMENTS` = country codes + optional `--repo=<name>`
- Default country: `ng`, default repo: `fe-web-mvc`
- Valid countries: ng, gh, ke, zm, tz, ug, za, int, br, ng1, ng2, ng3, ng4, ng5, ug2, int1
- Valid repos: `fe-web-mvc`, `fe-management` (any repo under `job/TW-FE/job/{repo}/job/uat`)
- Examples:
  - no arguments → deploy fe-web-mvc to ng
  - `ng,zm` → deploy fe-web-mvc to ng,zm
  - `ng --repo=fe-management` → deploy fe-management to ng
  - `ng,zm --repo=fe-management` → deploy fe-management to ng,zm

## Procedure

### Step 1: Parse arguments

Parse `$ARGUMENTS` for country codes and `--repo=<name>`. If countries empty, default to `ng`. If repo not specified, default to `fe-web-mvc`. Normalize country separators (space, comma, slash) to comma-delimited.

### Step 2: Confirm with user

Display the deployment summary and ask for explicit confirmation using the
current agent's available user-input mechanism:

```
🚀 UAT Deployment
- Repo: {repo}
- Countries: {countries}
- Branch: uat
- Environment: uat
- Brand: sportybet

Proceed? (y/n)
```

If user declines, abort.

### Step 3: Trigger build

Resolve this skill's installed directory from the loaded `SKILL.md` path, then
run the adjacent `scripts/deploy.sh` script. Do not assume a Claude or Codex
home-directory layout.

```bash
bash "{skill-directory}/scripts/deploy.sh" "{countries}" --repo={repo}
```

Requires env vars: `JENKINS_URL`, `JENKINS_USER`, `JENKINS_TOKEN`.

Parse the output for `QUEUE_URL` and `CONSOLE_URL`. Report the console URL to the user.

### Step 4: Poll build status in background

Use the `QUEUE_URL` from Step 3 to poll — do NOT re-trigger. Run in background:

```bash
bash "{skill-directory}/scripts/deploy.sh" --poll-queue={QUEUE_URL} --repo={repo}
```

Use the current agent's background-process capability when available. Otherwise
poll in the foreground and keep the user informed.

### Step 5: Notify on completion

When the background task completes, parse the output for `BUILD_RESULT`. Send macOS notification:

```bash
osascript -e 'display notification "UAT deploy {repo} {countries}: {result}" with title "Jenkins" sound name "Glass"'
```

Report the final result (SUCCESS/FAILURE) and build URL to the user.

# Orca runtime

Orca supervises the workers and wakes you when they report. Every command
takes `--json`; read IDs from the responses.

## Set up the run

1. Create a run: `orca orchestration run-create --objective "Implement board <feature>" --json`.
2. Create one task per card, in topological order so each dependency's task ID
   exists before its dependants:

   ```bash
   orca orchestration task-create --task-title "<feature> <card key>: <card title>" \
     --spec-file <worker-spec-file> --deps '<json array of dependency task IDs>' --json
   ```

   Write each worker spec to a temporary file first, and keep a card-key to
   task-ID map for the rest of the run.

## Start workers

For each frontier card, up to `cap` running:

```bash
orca orchestration worker-start --task <task-id> --worktree new-child \
  --base-branch <integration-branch> --name <feature>-<card-key> \
  --agent <your own agent id, such as claude or codex> --setup run --json
```

Record each dispatch ID and the worker's branch from the receipt. When
`worker-start` fails, read `failedStage` and report it; a failed start is
never rerun blindly.

Then **end your turn**. Orca wakes you when a worker reports; polling or
watch scripts hide that mail from you.

## When Orca wakes you

Act on each message:

- `worker_done`: read its outcome, branch, and evidence (with
  `orca orchestration worker-read --dispatch <id>` when the message is short),
  then handle it as in step 4 of the skill.
- `question`: when the card or its sources answer it, reply with
  `orca orchestration reply --id <message-id> --body "<answer>"`; otherwise ask
  the user and relay their answer.
- `escalation` with a `stopReason`: the worker stopped without reporting. Treat
  it as a failed card.

For a card going back to its worker (merge conflict, review fixes), use
`orca orchestration send --to dispatch:<id> --subject "<topic>" --body "<instruction>"`.
Steer workers through `send` only, never by typing into their terminals.

For a `Blocked` card, keep its pane for the user:
`orca orchestration worker-keep-open --dispatch <id>`.

After handling the batch, dispatch the new frontier and end your turn again.
Finished workers close their own terminals; their worktrees stay.

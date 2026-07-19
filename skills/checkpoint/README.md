# Checkpoint

Checkpoint stores a compact, branch-aware work snapshot in the current
project's `.ai/checkpoints/` directory. It supports save, resume, and list
modes and works with any agent that can read files and inspect Git state.

New checkpoints are written only to `.ai/checkpoints/`. For backward
compatibility, the skill can read legacy checkpoint locations under
`.claude/`, `.codex/`, or `.Codex/` when the neutral location does not exist.

Add `.ai/` to a project's ignore rules when checkpoints and other agent runtime
state should remain local.

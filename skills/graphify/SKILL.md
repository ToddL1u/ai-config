---
name: graphify
description: Build or query a local knowledge graph of a repository or folder (code, docs, PDFs, images) with the graphify CLI, then answer structure questions from the graph instead of re-reading files. Use when the user invokes graphify, asks for a codebase map, god nodes, or how two parts connect, or wants to query an existing graphify-out/ graph.
---

# Graphify

Wrap the `graphify` CLI (PyPI package `graphifyy`). The CLI does the
extraction; this skill picks the mode, runs it, and reads the results.

Stop with a clear message if `graphify` is not on `PATH`, and suggest
`uv tool install graphifyy`. Do not run `graphify install`: it installs a
second skill with this name and edits the agent's global instruction file.

## 1. Pick the action

- **Query** — `graphify-out/graph.json` exists and the user asked a question:
  go to step 3.
- **Update** — the graph exists but files changed: run `graphify update <path>`
  (code changes only, no LLM), then continue.
- **Build** — no graph yet, or the user asked for a rebuild: step 2.

## 2. Build

Default to code only. It parses locally with tree-sitter, needs no LLM, and
costs nothing:

```bash
graphify extract <path> --code-only
graphify cluster-only <path> --no-label
```

`extract` writes only `graph.json`; `cluster-only` adds `GRAPH_REPORT.md` and
`graph.html`. `--no-label` names communities `Community N` instead of calling
an LLM to name them.

Run the full extraction only when the user asks for it or the folder is mostly
docs, PDFs, or images. It sends those files to an LLM, so first state the file
count and ask for confirmation:

```bash
graphify extract <path> --backend claude-cli
graphify cluster-only <path>
```

`claude-cli` uses the local Claude Code subscription. Other backends need their
own API key; use one only if the user names it. Either LLM step needs network
access to the provider; if it hangs, stop it and report that instead of
retrying.

Output goes to `<path>/graphify-out/`. If the path is inside a Git repository
and `graphify-out/` is not ignored, tell the user; do not edit `.gitignore`
for them.

## 3. Read and answer

- Overview: read `graphify-out/GRAPH_REPORT.md` and summarize the god nodes,
  surprising connections, and suggested questions.
- Questions, in order of specificity:

  ```bash
  graphify query "<question>" --budget 2000
  graphify path "<source>" "<target>"
  graphify explain "<node>"
  graphify affected "<node>" --depth 2
  ```

Every edge is tagged `EXTRACTED`, `INFERRED`, or `AMBIGUOUS`. Say which kind
an answer rests on, and confirm `INFERRED` or `AMBIGUOUS` claims against the
cited source before treating them as fact. Point the user to
`graphify-out/graph.html` for the interactive view.

## Guardrails

- Read-only toward the analyzed code: graphify writes only to `graphify-out/`.
- Never install hooks (`graphify hook install`, `graphify claude install`)
  unless the user asks.
- Never use `--neo4j-push`, `add <url>`, or the hosted platform unless the
  user asks.

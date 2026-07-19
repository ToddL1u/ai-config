---
name: memcheck
description: "Check macOS memory and CPU usage, identify heavy processes, and interactively kill them. Triggers on: memcheck, check memory, memory usage, what's using memory, kill process, memory lag."
---

# memcheck — Memory Monitor & Process Killer

Check what's eating memory and CPU on macOS, then optionally kill offenders.

## When to use
- System feels laggy or slow
- Fan is spinning up
- Want to see what's consuming RAM/CPU
- Want to kill specific processes without opening Activity Monitor

## Workflow

### Step 1 — Snapshot current state

Run both commands in parallel:

```bash
ps -Ao rss,pid,%cpu,user,comm -r | head -25
```

```bash
vm_stat | grep -E "free|active|wired|compressor|Swap"
sysctl -n hw.memsize kern.memorystatus_level 2>/dev/null
```

### Step 2 — Parse memory pressure

**Total RAM**: `hw.memsize / 1073741824` → GB

**Free pages**: `Pages free × 16384` → MB

**Memory status level** (kern.memorystatus_level):
- 0–25: Critical — system killing background processes
- 26–50: Warning — compressor/swap thrashing, this causes lag
- 51–100: OK

**Swap activity**: If Swapins or Swapouts are climbing fast between checks, the system is actively swapping — guaranteed lag.

### Step 3 — Build the hit list

From `ps` output, identify:
- Any single process with RSS > 500 MB → flag as **memory hog**
- Any single process with %CPU > 40% → flag as **CPU hog**
- Multiple processes from the same parent (e.g. 3× `fork-ts-checker`) → flag as **runaway workers**

Convert RSS from KB to MB: `RSS / 1024`

Present a ranked table:

```
| # | Process | PID | RSS | CPU | Flag |
|---|---------|-----|-----|-----|------|
| 1 | tsserver | 14255 | 856 MB | 12% | memory hog |
| 2 | node (fork-ts-checker) | 57008 | 1.6 GB | 49% | memory + CPU hog |
```

For `node` or unnamed processes, identify them:
```bash
ps -o pid,args -p <pid1> <pid2> ...
```

### Step 4 — Ask what to kill

After presenting the table, ask the user:

> "Which processes do you want to kill? Give me the # numbers or say 'all flagged'."

**Never kill without explicit user confirmation.**

### Step 5 — Kill selected processes

For each confirmed PID:
```bash
kill <pid>
```

If process doesn't die after 2 seconds, escalate:
```bash
kill -9 <pid>
```

Report what was killed and estimated memory freed (sum of RSS).

### Step 6 — Verify relief

Re-run vm_stat after killing:
```bash
vm_stat | grep -E "free|active|compressor"
```

Report: free pages before vs after, estimated MB recovered.

## Process identification cheat sheet

| COMM pattern | Usually means |
|---|---|
| `fork-ts-checker` | TypeScript type checker spawned by webpack dev server |
| `tsserver` | TypeScript language server (Neovim LSP or VS Code/Cursor) |
| `node --max-old-space-size=...` | Dev server or build watcher with a memory cap |
| `miaow-config` | fe-web-mvc internal config/build watcher |
| `Cursor Helper (Plugin)` | Cursor IDE extension host |
| `Google Chrome Helper (Renderer)` | One Chrome tab or extension |
| `Spotify Helper (Renderer)` | Spotify UI process |

## Safety rules
- NEVER kill system processes (root-owned, WindowServer, coreaudiod, kernel_task)
- NEVER kill without the user saying yes
- Warn before killing a dev server — it may have unsaved state or take time to restart
- If unsure what a process is, identify it first with `ps -o pid,args -p <pid>`

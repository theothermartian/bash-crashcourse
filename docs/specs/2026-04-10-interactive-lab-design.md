# Interactive Bash Lab — Design Spec
**Date:** 2026-04-10
**Status:** Approved, ready for implementation planning
**Author:** theothermartian + Claude

---

## Overview

A browser-based interactive learning tool for the Bash Crashcourse. Students open a URL in their browser, see a split-panel UI (real terminal + quiz panel), and work through bash challenges that test real command execution inside an isolated Alpine Linux container. No student setup required — instructor runs `docker-compose up`.

---

## Goals

- Make the course interactive beyond "type what the slide says"
- Test real bash command execution, not simulated output
- Cover all bash fundamentals: pipes, redirection, subshells, variables, scripting, and more
- Zero friction for students — just open a browser URL
- Self-contained: runs offline on a single laptop or small server

---

## Architecture

```
Browser
  ├── xterm.js  (terminal emulator)
  └── Quiz panel (question, description, use case, hints, pass/fail)
         ↕ WebSocket
Node.js backend  (node:alpine Docker image)
  ├── WebSocket server (ws)
  ├── Quiz engine  (loads JSON question bank, tracks session state)
  ├── Container manager  (dockerode — spins up/tears down runners)
  └── Static file server  (serves frontend HTML/JS)
         ↕ Docker socket (/var/run/docker.sock)
Alpine runner container  (one per browser session)
  ├── bash, shellcheck, grep, awk, sed, coreutils, find, curl
  ├── Course files pre-loaded (labs/, shared/, scenarios/)
  ├── Non-root user: student
  └── Resource limits: 256MB RAM, 0.5 CPU, no external network
```

**Start command:** `docker-compose up`
**Student access:** `http://<instructor-ip>:3000`

---

## File Layout

```
bash-crashcourse/
└── interactive/
    ├── docker-compose.yml          # orchestrates backend + pre-builds runner image
    ├── backend/
    │   ├── Dockerfile              # node:alpine base
    │   ├── server.js               # WebSocket + static file server
    │   ├── quiz-engine.js          # session state, question sequencing, validation
    │   ├── container-manager.js    # dockerode: create, exec, destroy containers
    │   └── questions/
    │       ├── module01-navigation.json
    │       ├── module02-pipes.json
    │       ├── module03-redirection.json
    │       ├── module04-heredocs.json
    │       ├── module05-process-substitution.json
    │       ├── module06-subshells.json
    │       ├── module07-command-substitution.json
    │       ├── module08-variables-quoting.json
    │       ├── module09-parameter-expansion.json
    │       ├── module10-special-variables.json
    │       ├── module11-arithmetic.json
    │       ├── module12-conditionals-tests.json
    │       ├── module13-case-statements.json
    │       ├── module14-loops.json
    │       ├── module15-functions.json
    │       ├── module16-arrays.json
    │       ├── module17-globbing-patterns.json
    │       ├── module18-text-processing.json
    │       ├── module19-job-control.json
    │       └── module20-error-handling-debug.json
    ├── frontend/
    │   ├── index.html              # split-panel layout
    │   ├── terminal.js             # xterm.js init + WebSocket bridge
    │   └── quiz.js                 # question display, hints, pass/fail UI
    └── runner/
        ├── Dockerfile              # alpine + bash + tools
        └── setup.sh                # pre-loads course files into container
```

---

## Question Bank

### Source Mapping

| Existing material | Maps to |
|---|---|
| Slide content | `description` + `use_cases` |
| Instructor notes (common mistakes) | `hints[]` |
| Lab checkpoint criteria | `validation` rules |
| Nuclear scenario framing | `scenario` narrative |
| Student reference card | Answer reference for hint 3 |

### Question Format

```json
{
  "id": "m03-q02",
  "category": "Redirection",
  "scenario": "A backup script on Reactor Block A is producing both logs and errors. You need errors in a separate file and don't care about stdout.",
  "question": "Run ./backup.sh sending stdout to /dev/null and stderr to /tmp/errors.log",
  "description": "Bash has three standard streams: stdin (0), stdout (1), stderr (2). Each can be redirected independently. /dev/null silently discards output.",
  "use_cases": [
    "Suppressing noisy stdout from cron jobs while capturing errors",
    "Separating application logs from error logs in production scripts"
  ],
  "hints": [
    "Stdout is stream 1, stderr is stream 2 — redirect them separately",
    "Discard stdout with > /dev/null, redirect stderr with 2>",
    "./backup.sh > /dev/null 2>/tmp/errors.log"
  ],
  "validation": {
    "type": "multi",
    "checks": [
      { "type": "file_exists", "path": "/tmp/errors.log" },
      { "type": "exit_code",   "expected": 0 }
    ]
  }
}
```

### Validation Types

| Type | Description | Example |
|---|---|---|
| `output_match` | stdout matches regex | `echo $?` → `^[0-9]+$` |
| `output_contains` | stdout contains substring | `grep ERROR log` → `"ERROR"` |
| `file_exists` | path exists after command | `touch foo.txt` |
| `file_not_empty` | file exists and has content | backup file check |
| `exit_code` | command exits with specific code | `0` or non-zero |
| `multi` | AND of multiple checks | create + chmod + content |

### 20 Categories (~80-100 questions total)

| # | Category | Core concepts |
|---|---|---|
| 1 | Navigation & files | `pwd`, `ls -la`, `find`, `cp`, `mv`, `rm` guards |
| 2 | Pipes & chaining | `\|`, `&&`, `\|\|`, `;`, `tee`, `xargs` |
| 3 | Redirection | `>`, `>>`, `2>`, `2>&1`, `/dev/null`, `/dev/stdin` |
| 4 | Here-docs & here-strings | `<<EOF`, `<<'EOF'` (no expansion), `<<<` |
| 5 | Process substitution | `<(cmd)`, `>(cmd)`, `diff <(f1) <(f2)` |
| 6 | Subshells | `(...)`, variable scope isolation, side effects |
| 7 | Command substitution | `$(cmd)`, nesting, whitespace/newline traps |
| 8 | Variables & quoting | `"$var"` vs `$var` vs `'$var'`, word splitting, IFS |
| 9 | Parameter expansion | `${var:-default}`, `${#var}`, `${var//old/new}`, `${var#prefix}`, `${var^^}` |
| 10 | Special variables | `$?`, `$$`, `$!`, `$#`, `$@`, `$*`, `$IFS`, `$RANDOM`, `$LINENO` |
| 11 | Arithmetic | `$(( ))`, `((i++))`, `let`, `bc` for floats |
| 12 | Conditionals & tests | `[[ ]]` vs `[ ]`, `-f/-d/-s/-z/-n`, `=~` regex |
| 13 | Case statements | patterns, `;;`, `;;&` fallthrough |
| 14 | Loops | `for in`, `for (())`, `while read`, `until`, `break`/`continue` |
| 15 | Functions | `local`, return vs exit codes, `$FUNCNAME`, argument passing |
| 16 | Arrays | indexed `arr=()`, associative `declare -A`, `${arr[@]}`, iteration |
| 17 | Globbing & patterns | `*`, `?`, `[a-z]`, brace expansion `{a..z}`, extglob `+(pattern)` |
| 18 | Text processing | `grep -E`, `awk -F`, `sed s/old/new/g`, `cut`, `tr`, `sort\|uniq -c\|sort -rn` |
| 19 | Job control | `&`, `fg`, `bg`, `jobs`, `wait`, `nohup`, `disown`, `Ctrl+Z` |
| 20 | Error handling & debug | `set -euo pipefail`, `trap ERR/EXIT`, `set -x`, `shellcheck`, `$LINENO` |

**Bonus quirks woven into questions throughout:**
- `"$@"` vs `"$*"` — look identical, behave completely differently
- `[ ]` vs `[[ ]]` — regex (`=~`) only works in `[[ ]]`
- `source` vs `./` — runs in current shell vs subshell
- `printf` vs `echo` — portability traps with `-n`, `-e`
- `eval` — why it exists and why to avoid it
- `/dev/tcp/host/port` — bash has built-in networking

---

## UI Layout

```
┌─────────────────────────┬────────────────────────────┐
│                         │  [Module 3 · Q4 of 6]  60% │
│   xterm.js terminal     │  ━━━━━━━━━━━━━━━━━━━━       │
│                         │                            │
│   student@reactor:~$ _  │  SCENARIO                  │
│                         │  "A backup script on       │
│   (real bash,           │   Reactor Block A..."      │
│    real Alpine Linux,   │                            │
│    real output)         │  QUESTION                  │
│                         │  "Redirect stdout to       │
│                         │   /dev/null, stderr to     │
│                         │   /tmp/errors.log"         │
│                         │                            │
│                         │  📖 Description  ▼         │
│                         │  💡 Hint  (1 of 3)         │
│                         │                            │
│                         │  ✅ Correct!               │
└─────────────────────────┴────────────────────────────┘
```

---

## Quiz Flow

```
Student opens URL
    ↓
Backend spawns Alpine container for this session
    ↓
Show first question (scenario + question text)
    ↓
Student types command in terminal
    ↓
Backend captures command + output, runs validation
    ↓
PASS → green flash, 2s pause, next question
FAIL → nothing forced (student retries freely)
    ↓
"Hint" button → reveals hint 1 of 3 progressively
After hint 3 → "Show Answer" unlocks
    ↓
Module complete → score card → next module unlocks
    ↓
Session ends → container destroyed automatically
```

---

## Safety & Isolation

| Concern | Mitigation |
|---|---|
| Root access | Non-root `student` user inside container, no sudo |
| Resource abuse | 256MB RAM, 0.5 CPU cap via docker-compose |
| Disk abuse | Overlay filesystem, no persistent volume |
| Network abuse | Internal bridge only, no external network access |
| Dangerous commands | Blocklist: `rm -rf /`, `:(){ :\|:& };:` (fork bomb), `dd if=/dev/zero` |
| Runaway commands | 10-second timeout — process killed, student notified |
| Container leaks | Container tied to WebSocket session — destroyed on disconnect |

---

## Docker Stack

### docker-compose.yml (summary)
- `backend` service: `node:alpine`, mounts `/var/run/docker.sock`
- `runner` image: pre-built Alpine image with course files baked in
- Backend port: `3000` exposed to LAN
- No external volumes, no persistent state

### runner/Dockerfile (Alpine base)
```dockerfile
FROM alpine:latest
RUN apk add --no-cache bash shellcheck coreutils grep gawk sed findutils curl
RUN adduser -D -s /bin/bash student
COPY setup.sh /setup.sh
RUN bash /setup.sh
USER student
WORKDIR /home/student
CMD ["bash"]
```

### setup.sh
- Copies `labs/`, `shared/`, `scenario*/` course files into `/home/student/`
- Creates `/var/log/crashcourse/` with sample log data
- Sets permissions: `750` on scripts, `640` on configs

---

## Out of Scope (v1)

- User accounts / persistent progress across sessions
- Leaderboard or scoring visible to instructor
- Multiplayer / collaborative challenges
- Mobile layout
- Question editor UI
- PostgreSQL / systemctl inside runner (Alpine is too lightweight — future runner variant)

---

## Open Questions (to resolve during implementation)

1. **Question authoring:** Write all 80-100 questions by hand, or generate drafts from slides programmatically first?
2. **Hint reveal timing:** Reveal hint after N failed attempts, or always on-demand?
3. **Module gating:** Must complete module N to unlock N+1, or free navigation?
4. **Session persistence:** If student closes tab and reopens, do they resume or restart?

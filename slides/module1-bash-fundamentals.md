# Module 1 — Bash Fundamentals & The Nuclear Mindset
**Duration:** 20 min (10 min lecture + 10 min Lab 1)

---

## Slide 1-1: What Is Bash?

- Bash = Bourne Again Shell. Every Linux system has it. Not optional.
- A bash script is a list of commands the OS executes top-to-bottom
- You will read and write these every day as a sysadmin/DBA
- Unlike Python: no imports, no classes, no garbage collector — just the OS

---

## Slide 1-2: How Bash Is Different From What You Know

- Whitespace is syntax. `x=1` works. `x = 1` does not.
- No types. Everything is a string. Arithmetic is explicit.
- Exit codes are backwards: `0` = success, anything else = failure
- The shell runs on your real system. A typo can delete real files.
- There is no "undo"

---

## Slide 1-3: The Safety Warning *(say this out loud)*

> "Every script in this room runs against a real Ubuntu VM. It is not sandboxed. A bad command will break your VM. That is acceptable here — it is not acceptable in production. Treat every exercise like production anyway."

- This framing applies at the nuclear facility: there are no "dev" environments that cannot hurt you
- Build the habit now: slow down, read before you run

---

## Slide 1-4: The Standard Script Header — Every Single Script

```bash
#!/bin/bash
set -euo pipefail
```

- `#!/bin/bash` — shebang. Tells the OS which interpreter to use. Never omit it.
- `set -e` — exit immediately on any command that returns non-zero
- `set -u` — treat unset variables as errors (catches typos in var names)
- `set -o pipefail` — a pipe fails if ANY command in it fails (not just the last)
- Without this header, errors are silently swallowed

---

## Slide 1-5: Exit Codes

- Every command returns an exit code when it finishes
- `0` = success. `1`–`255` = failure (meaning varies by program)
- Check the last exit code: `echo $?`
- This is how scripts detect whether a previous step succeeded
- Databases: if `pg_dump` exits non-zero, the backup is bad. Your script must detect this.

---

## Slide 1-6: The Quoting Law

- Always quote variables: `"$varname"` not `$varname`
- Unquoted: bash splits the value on spaces and expands globs
- Example: `dir=""` then `rm -rf $dir/*` → removes everything in current directory
- Quoted: `rm -rf "$dir"/*` → bash catches the empty string
- **Nuclear rule: if the variable touches a path, a command, or a filename — quote it**

---

## Slide 1-7: shellcheck — Your Mandatory Linter

- `shellcheck script.sh` — static analysis, catches bugs before they run
- Catches: unquoted variables, undefined variables, bad conditionals, portability issues
- Run it before executing any script. No exceptions.
- If shellcheck complains and you don't understand why — ask before running
- Install: `sudo apt install shellcheck`

---

## Slide 1-8: The Nuclear Rules *(post this on your wall)*

1. `set -euo pipefail` on every script
2. Quote every variable: `"$var"`
3. Dry-run before destructive operations
4. Never `rm -rf` without a guard check on the variable
5. `shellcheck` before executing any script
6. Back up before modifying
7. Document every `sudo` operation and why
8. If you don't know what a command does — do not run it

---

## Instructor Notes

**Timing:** 10 min lecture, 10 min lab. Do not let lecture run over — the lab is where concepts land.

**Demo before lab:** Type `x = 1` live to show the error. Then type `x=1; echo $x`. The contrast lands better than explaining.

**What to emphasize:**
- `set -euo pipefail` is non-negotiable. Every script, forever, no exceptions. Say this three times.
- The quoting law is the #1 source of production incidents from shell scripts.
- shellcheck is not optional. "Would you push code without running the compiler?"

**Common student mistakes:**
- Spaces around `=` in variable assignment (`x = 1`)
- Forgetting the shebang line — script may run under `sh`
- Running shellcheck and ignoring the output
- Shebang as `#!/usr/bin/bash` — both paths exist, `#!/bin/bash` is conventional

**Safety note:** When students see `set -e`, some will disable it to "make the script easier to debug." Pre-empt this: disabling safety features in a nuclear environment is a procedural violation.

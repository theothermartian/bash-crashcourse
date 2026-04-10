# Module 7 — Bash Scripting Essentials
**Duration:** 30 min (15 min lecture + 20 min Lab 7)

---

## Slide 7-1: The Safety Warning

> "A script that accepts user input or positional arguments must validate them. `rm -rf "$1"` where `$1` is unvalidated input is a remote code execution / accidental deletion waiting to happen. Validate arguments before using them."

---

## Slide 7-2: Variables and Special Variables

```bash
name="reactor-1"           # assignment (no spaces around =)
echo "$name"               # always quote
echo "${name}"             # explicit boundary (same thing)
echo "${name:-default}"    # use 'default' if name is unset or empty
echo "${name:?'name required'}"  # exit with error if unset

# Special variables
$0     # script name
$1 $2  # positional arguments
$@     # all arguments as separate words (use this)
$*     # all arguments as one string (avoid this)
$#     # number of arguments
$?     # exit code of last command
$$     # PID of current shell
$!     # PID of last background process
```

---

## Slide 7-3: Parameter Expansion

```bash
name="reactor-control"

echo "${name^^}"           # REACTOR-CONTROL (uppercase)
echo "${name,,}"           # reactor-control (lowercase)
echo "${#name}"            # 15 (string length)
echo "${name#*-}"          # control (remove up to first -)
echo "${name%-*}"          # reactor (remove from last - to end)
echo "${name/control/monitor}"  # reactor-monitor (replace)
echo "${name:-offline}"    # reactor-control (already set, no change)
unset name
echo "${name:-offline}"    # offline (was unset)
```

---

## Slide 7-4: Command Substitution and Arithmetic

```bash
# Command substitution
now=$(date +%Y%m%d)
hostname=$(hostname -f)
line_count=$(wc -l < /var/log/syslog)

# Arithmetic — must use $(( ))
count=5
count=$(( count + 1 ))
echo $(( 100 * 3 / 4 ))        # 75 (integer arithmetic)
echo $(( 2 ** 8 ))             # 256

# Bash does NOT do floating point
# For floats: use awk or bc
echo "scale=2; 10/3" | bc      # 3.33
```

---

## Slide 7-5: Conditionals — Always Use [[ ]]

```bash
# String comparisons
if [[ "$var" == "expected" ]]; then ... fi
if [[ "$var" != "bad" ]]; then ... fi
if [[ -z "$var" ]]; then ... fi       # true if empty
if [[ -n "$var" ]]; then ... fi       # true if non-empty

# Numeric comparisons
if [[ "$count" -gt 10 ]]; then ... fi   # greater than
if [[ "$count" -lt 5 ]]; then ... fi    # less than
if [[ "$count" -eq 0 ]]; then ... fi    # equal
if [[ "$count" -ne 0 ]]; then ... fi    # not equal

# File tests
if [[ -f "$path" ]]; then ... fi
if [[ -d "$dir" ]]; then ... fi
if [[ -x "$script" ]]; then ... fi

# Compound
if [[ "$a" == "x" && "$b" -gt 0 ]]; then ... fi
if [[ "$a" == "x" || "$a" == "y" ]]; then ... fi
```

- Always `[[ ]]`, never `[ ]`. The double bracket is bash-specific and safer.

---

## Slide 7-6: Loops

```bash
# for loop — files
for file in /var/log/*.log; do
  echo "Processing: $file"
done

# for loop — range
for i in $(seq 1 10); do
  echo "Iteration: $i"
done

# for loop — array
services=("postgres" "nginx" "backup-agent")
for svc in "${services[@]}"; do
  systemctl is-active "$svc" && echo "$svc: UP" || echo "$svc: DOWN"
done

# while loop — wait for condition
attempts=0
while ! systemctl is-active postgres &>/dev/null; do
  echo "Waiting for postgres... (attempt $((++attempts)))"
  sleep 5
  [[ "$attempts" -ge 12 ]] && { echo "Timeout"; exit 1; }
done
echo "postgres is up"
```

---

## Slide 7-7: Functions

```bash
# Define
log_msg() {
  local level="$1"     # local scope — does not leak out of function
  local msg="$2"
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $msg"
}

# Call
log_msg "INFO" "Service started"
log_msg "ERROR" "Connection failed"

# Function with return code
check_port() {
  local port="$1"
  ss -tulpn | grep -q ":${port} " && return 0 || return 1
}

if check_port 5432; then
  echo "Postgres is listening"
fi
```

- Always use `local` for variables inside functions — prevents leaking into global scope
- Functions can return 0–255 via `return`. For data: use `echo` and capture with `$()`

---

## Slide 7-8: Error Handling and Traps

```bash
#!/bin/bash
set -euo pipefail

# Trap ERR: runs when any command fails (with set -e)
trap 'echo "ERROR: script failed at line $LINENO — exit code: $?"' ERR

# Trap EXIT: runs when script exits for ANY reason
cleanup() {
  echo "Cleaning up..."
  rm -f /tmp/mylockfile
}
trap cleanup EXIT

# Lockfile pattern (prevent concurrent runs)
lockfile="/tmp/backup.lock"
if [[ -f "$lockfile" ]]; then
  echo "ERROR: another instance is running (lockfile: $lockfile)"
  exit 1
fi
touch "$lockfile"
# cleanup trap will remove it on exit

# Check command results explicitly
pg_dump mydb > /tmp/backup.sql || { echo "Backup failed!"; exit 1; }
```

---

## Instructor Notes

**Timing:** 15 min lecture, 20 min lab. This is the longest and most important module in Part 1. The lab produces a real operational script students can keep.

**What to emphasize:**
- `local` variables inside functions. If students do not use `local`, their function variables pollute global scope and cause bugs that are extremely hard to find.
- The argument validation pattern with `=~` regex. Service names that contain `; rm -rf /` should not be executed. Input validation is a security control.
- `tee -a` — writes to both stdout AND appends to the file. Correct pattern for scripts that need log files but also need to show output interactively.
- The difference between `set -e` stopping the script and explicit `if/else` error handling.

**Common student mistakes:**
- Forgetting `local` in functions — variables leak globally
- Not validating the argument at all: `SERVICE="$1"` without checking `$#` first — crashes with "unbound variable"
- Using backticks `` `command` `` instead of `$(command)` — shellcheck prefers `$()`
- Writing the entire script without testing incrementally

**For faster students:** Have them extend the script to accept a list of services as arguments and check each one in a loop.

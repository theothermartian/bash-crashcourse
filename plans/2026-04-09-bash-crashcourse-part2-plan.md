# Bash Crashcourse Part 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all teaching materials for Part 2 (scenarios) of the bash crashcourse — lab exercise files, reference solution scripts, instructor notes, a synthetic incident log, and a student cheat sheet.

**Architecture:** Each scenario gets its own directory under `labs/`. Each directory contains: student exercise file, reference solution script(s), and instructor notes. Shared materials (cheat sheet, incident.log) live in `labs/shared/`.

**Tech Stack:** Bash scripts (Ubuntu), Markdown for docs, plain text for log files.

---

## File Structure

```
labs/
├── shared/
│   ├── incident.log              # Pre-built synthetic log for Scenario 3
│   ├── cheatsheet.md             # One-page student reference
│   └── script-template.sh        # Canonical script header every student starts from
├── scenario1-health-check/
│   ├── exercise.md               # Student-facing instructions
│   ├── solution/
│   │   └── health_check.sh       # Full reference solution
│   └── instructor-notes.md       # What to watch for, common mistakes
├── scenario2-db-backup/
│   ├── exercise.md
│   ├── solution/
│   │   └── db_backup.sh
│   └── instructor-notes.md
└── scenario3-incident-response/
    ├── exercise.md
    ├── solution/
    │   └── analyze.sh            # Reference pipeline commands
    └── instructor-notes.md
```

---

## Task 1: Shared Script Template

**Files:**
- Create: `labs/shared/script-template.sh`

- [ ] **Step 1: Create the canonical script template every student starts from**

```bash
cat > /Users/thereisnocake/labs/shared/script-template.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Script: <name>.sh
# Purpose: <one line description>
# Usage: ./<name>.sh [args]
# ---------------------------------------------------------------------------

# --- Functions ---

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE:-/tmp/script.log}"
}

die() {
  log "ERROR: $*"
  exit 1
}

# --- Guards ---

[[ $# -ge 1 ]] || die "Usage: $0 <arg>"

# --- Main ---

main() {
  log "Starting $0"
  # TODO: implement
  log "Done"
}

main "$@"
EOF
chmod +x /Users/thereisnocake/labs/shared/script-template.sh
```

- [ ] **Step 2: Verify template passes shellcheck**

```bash
shellcheck /Users/thereisnocake/labs/shared/script-template.sh
```
Expected: no output (zero warnings)

---

## Task 2: Student Cheat Sheet

**Files:**
- Create: `labs/shared/cheatsheet.md`

- [ ] **Step 1: Write the one-page cheat sheet**

```bash
cat > /Users/thereisnocake/labs/shared/cheatsheet.md << 'EOF'
# Bash Sysadmin Cheat Sheet

## Every Script Starts With
```bash
#!/bin/bash
set -euo pipefail
```

## Navigation
| Command | What it does |
|---|---|
| `pwd` | Print current directory |
| `cd /path` | Change directory |
| `ls -la` | List files with permissions |
| `find /path -name "*.log"` | Find files by name |

## File Operations (BE CAREFUL)
| Command | What it does |
|---|---|
| `cp -r src/ dest/` | Copy recursively |
| `mv file newname` | Move or rename |
| `rm file` | Delete file (IRREVERSIBLE) |
| `mkdir -p /path/to/dir` | Create directory tree |
| `chmod 750 file` | Set permissions (rwxr-x---) |
| `chown user:group file` | Change owner |

## Safety Before rm
```bash
[[ -n "$dir" ]] || { echo "ERROR: dir is empty"; exit 1; }
```

## Text Processing
| Command | What it does |
|---|---|
| `cat file` | Print file |
| `head -20 file` | First 20 lines |
| `tail -f file` | Follow file live |
| `grep -E "pattern" file` | Search with regex |
| `grep -c "pattern" file` | Count matches |
| `sort \| uniq -c \| sort -rn` | Count + rank unique lines |
| `awk '{print $2}'` | Print column 2 |
| `cut -d: -f1` | Cut field 1 by delimiter |
| `sed 's/old/new/g'` | Replace text |
| `wc -l file` | Count lines |

## Redirection
```bash
cmd > file        # overwrite
cmd >> file       # append
cmd 2> errors     # stderr only
cmd 2>&1          # merge stderr into stdout
cmd > /dev/null   # silence all output
cmd1 | cmd2       # pipe stdout to next command
```

## Process Management
| Command | What it does |
|---|---|
| `ps aux` | List all processes |
| `pgrep nginx` | Find process by name |
| `kill -15 PID` | Graceful stop (try first) |
| `kill -9 PID` | Force kill (last resort) |
| `systemctl status svc` | Check service status |
| `systemctl restart svc` | Restart service |
| `journalctl -u svc -f` | Follow service logs |

## System Health
```bash
df -h             # Disk usage
du -sh /path      # Directory size
free -h           # Memory
uptime            # CPU load
ss -tulpn         # Open ports
```

## Variables & Quoting
```bash
name="value"       # assign (no spaces!)
echo "$name"       # always quote!
echo "${name:-default}"  # default if unset
now=$(date +%Y%m%d)      # command substitution
```

## Conditionals
```bash
if [[ "$var" == "value" ]]; then   # string
  echo "match"
elif [[ "$num" -gt 10 ]]; then     # integer
  echo "big"
fi

[[ -f "$file" ]] || die "file not found"
[[ -d "$dir"  ]] || die "dir not found"
[[ -n "$var"  ]] || die "var is empty"
```

## Loops
```bash
for file in /var/log/*.log; do
  echo "Processing $file"
done

while [[ "$status" != "ok" ]]; do
  sleep 5; status=$(check)
done
```

## Functions
```bash
my_func() {
  local arg="$1"
  echo "result"       # return values via echo
}
result=$(my_func "input")
```

## Error Handling
```bash
trap 'echo "ERROR at line $LINENO"; exit 1' ERR
trap 'rm -f /tmp/lockfile' EXIT
```

## Database Quick Reference
```bash
# PostgreSQL
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
pg_dump -U postgres mydb > backup_$(date +%Y%m%d).sql

# MySQL
mysql -u root -p"$MYSQL_PASS" -e "SHOW DATABASES;"
mysqldump -u root -p"$MYSQL_PASS" mydb > backup.sql

# Oracle
sqlplus -s user/pass@//host:1521/SID <<< "SELECT status FROM v\$instance; EXIT;"
```

## Nuclear Rules
1. `set -euo pipefail` — always
2. Quote all variables: `"$var"` not `$var`
3. Dry-run before destructive operations
4. `shellcheck` before running any script you didn't write
5. `kill -15` before `kill -9` (especially for databases)
6. Never hardcode credentials — use env vars or `.pgpass`/`.my.cnf`
7. Rollback plan before any production operation
EOF
```

- [ ] **Step 2: Verify file was created**

```bash
wc -l /Users/thereisnocake/labs/shared/cheatsheet.md
```
Expected: > 80 lines

---

## Task 3: Synthetic Incident Log

**Files:**
- Create: `labs/shared/incident.log`

- [ ] **Step 1: Generate a realistic synthetic incident log (~500 lines)**

```bash
mkdir -p /Users/thereisnocake/labs/shared

cat > /Users/thereisnocake/labs/shared/incident.log << 'EOF'
Apr  9 02:45:01 reactor-srv1 CRON[12301]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 02:45:02 reactor-srv1 systemd[1]: Started Session 42 of user ops.
Apr  9 02:50:01 reactor-srv1 CRON[12345]: (root) CMD (/usr/local/bin/backup.sh)
Apr  9 02:50:03 reactor-srv1 postgres[9821]: [12-1] LOG:  checkpoint starting: time
Apr  9 02:50:04 reactor-srv1 postgres[9821]: [12-2] LOG:  checkpoint complete: wrote 134 buffers
Apr  9 02:55:01 reactor-srv1 sshd[13201]: Accepted publickey for ops from 10.0.1.45 port 52341
Apr  9 02:58:14 reactor-srv1 postgres[9821]: [14-1] LOG:  autovacuum: processing database "monitoring"
Apr  9 02:59:59 reactor-srv1 kernel: [123456.789] EXT4-fs (sda1): re-mounted. Opts: errors=remount-ro
Apr  9 03:00:01 reactor-srv1 CRON[14001]: (root) CMD (/usr/local/bin/rotate_logs.sh)
Apr  9 03:00:02 reactor-srv1 postgres[9821]: [15-1] FATAL:  connection limit exceeded for non-superusers
Apr  9 03:00:02 reactor-srv1 postgres[9821]: [15-2] DETAIL:  All 100 connection slots are in use.
Apr  9 03:00:03 reactor-srv1 postgres[9822]: [16-1] FATAL:  connection limit exceeded for non-superusers
Apr  9 03:00:03 reactor-srv1 postgres[9822]: [16-2] DETAIL:  All 100 connection slots are in use.
Apr  9 03:00:04 reactor-srv1 postgres[9823]: [17-1] FATAL:  connection limit exceeded for non-superusers
Apr  9 03:00:05 reactor-srv1 app[14100]: ERROR: database connection failed: too many clients
Apr  9 03:00:05 reactor-srv1 app[14100]: ERROR: retrying in 5 seconds (attempt 1/3)
Apr  9 03:00:06 reactor-srv1 sshd[14102]: Failed password for invalid user admin from 192.168.1.200 port 44321
Apr  9 03:00:06 reactor-srv1 sshd[14103]: Failed password for invalid user admin from 192.168.1.200 port 44322
Apr  9 03:00:07 reactor-srv1 sshd[14104]: Failed password for invalid user root from 192.168.1.200 port 44323
Apr  9 03:00:07 reactor-srv1 sshd[14105]: Failed password for invalid user root from 192.168.1.200 port 44324
Apr  9 03:00:08 reactor-srv1 sshd[14106]: Failed password for invalid user postgres from 192.168.1.200 port 44325
Apr  9 03:00:08 reactor-srv1 sshd[14107]: Failed password for invalid user postgres from 192.168.1.200 port 44326
Apr  9 03:00:09 reactor-srv1 sshd[14108]: Failed password for invalid user ops from 192.168.1.200 port 44327
Apr  9 03:00:10 reactor-srv1 app[14100]: ERROR: database connection failed: too many clients
Apr  9 03:00:10 reactor-srv1 app[14100]: ERROR: retrying in 5 seconds (attempt 2/3)
Apr  9 03:00:11 reactor-srv1 postgres[9824]: [18-1] ERROR:  deadlock detected
Apr  9 03:00:11 reactor-srv1 postgres[9824]: [18-2] DETAIL:  Process 9824 waits for ShareLock on transaction 7291
Apr  9 03:00:11 reactor-srv1 postgres[9824]: [18-3] HINT:  See server log for query details.
Apr  9 03:00:12 reactor-srv1 postgres[9825]: [19-1] ERROR:  deadlock detected
Apr  9 03:00:13 reactor-srv1 kernel: [123789.001] Out of memory: Kill process 9826 (postgres) score 892
Apr  9 03:00:13 reactor-srv1 kernel: [123789.002] Killed process 9826 (postgres) total-vm:2048MB
Apr  9 03:00:14 reactor-srv1 postgres[9821]: [20-1] LOG:  server process (PID 9826) was terminated by signal 9
Apr  9 03:00:14 reactor-srv1 postgres[9821]: [20-2] DETAIL:  Failed process was running: SELECT * FROM sensor_readings WHERE...
Apr  9 03:00:15 reactor-srv1 app[14100]: CRITICAL: all retries exhausted, giving up on database connection
Apr  9 03:00:15 reactor-srv1 app[14100]: CRITICAL: monitoring service is DOWN
Apr  9 03:00:16 reactor-srv1 systemd[1]: monitoring.service: Main process exited, code=exited, status=1/FAILURE
Apr  9 03:00:16 reactor-srv1 systemd[1]: monitoring.service: Failed with result 'exit-code'.
Apr  9 03:00:17 reactor-srv1 systemd[1]: Failed to start Reactor Monitoring Service.
Apr  9 03:00:18 reactor-srv1 sshd[14110]: Failed password for invalid user admin from 192.168.1.200 port 44330
Apr  9 03:00:19 reactor-srv1 sshd[14111]: Failed password for invalid user admin from 192.168.1.200 port 44331
Apr  9 03:00:20 reactor-srv1 sshd[14112]: message repeated 5 times: [ Failed password for invalid user admin from 192.168.1.200]
Apr  9 03:00:21 reactor-srv1 sshd[14113]: PAM: 3 more authentication failures; logname= uid=0 euid=0 tty=ssh ruser= rhost=192.168.1.200
Apr  9 03:00:22 reactor-srv1 postgres[9821]: [21-1] LOG:  database system is shut down
Apr  9 03:00:25 reactor-srv1 postgres[9900]: [1-1] LOG:  database system was shut down at 2026-04-09 03:00:22 UTC
Apr  9 03:00:26 reactor-srv1 postgres[9900]: [2-1] LOG:  entering standby mode
Apr  9 03:00:27 reactor-srv1 postgres[9900]: [3-1] LOG:  redo starts at 0/4A000028
Apr  9 03:00:28 reactor-srv1 postgres[9900]: [4-1] LOG:  consistent recovery state reached at 0/4A000100
Apr  9 03:01:01 reactor-srv1 CRON[15001]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 03:01:02 reactor-srv1 app[15010]: ERROR: database connection failed: server not available
Apr  9 03:01:05 reactor-srv1 app[15010]: ERROR: database connection failed: server not available
Apr  9 03:02:01 reactor-srv1 CRON[15100]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 03:02:02 reactor-srv1 app[15110]: ERROR: database connection failed: server not available
Apr  9 03:03:14 reactor-srv1 postgres[9900]: [5-1] LOG:  database system is ready to accept read only connections
Apr  9 03:04:01 reactor-srv1 CRON[15200]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 03:04:03 reactor-srv1 postgres[9900]: [6-1] LOG:  replication terminated by primary server
Apr  9 03:05:00 reactor-srv1 postgres[9950]: [1-1] LOG:  database system is ready to accept connections
Apr  9 03:05:01 reactor-srv1 systemd[1]: monitoring.service: Scheduled restart job, restart counter is at 1.
Apr  9 03:05:02 reactor-srv1 app[16000]: INFO: database connection established
Apr  9 03:05:02 reactor-srv1 app[16000]: INFO: monitoring service is UP
Apr  9 03:05:10 reactor-srv1 systemd[1]: Started Reactor Monitoring Service.
Apr  9 03:10:01 reactor-srv1 CRON[16100]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 03:10:02 reactor-srv1 app[16000]: INFO: all systems nominal
Apr  9 03:15:01 reactor-srv1 CRON[16200]: (root) CMD (/usr/local/bin/health_check.sh)
Apr  9 03:15:02 reactor-srv1 app[16000]: INFO: all systems nominal
EOF
```

- [ ] **Step 2: Verify log file looks correct**

```bash
wc -l /Users/thereisnocake/labs/shared/incident.log
grep -c "ERROR\|FATAL\|CRITICAL" /Users/thereisnocake/labs/shared/incident.log
```
Expected: ~65 lines total, 20+ error lines

---

## Task 4: Scenario 1 — Health Check Exercise & Solution

**Files:**
- Create: `labs/scenario1-health-check/exercise.md`
- Create: `labs/scenario1-health-check/solution/health_check.sh`
- Create: `labs/scenario1-health-check/instructor-notes.md`

- [ ] **Step 1: Write student exercise file**

```bash
mkdir -p /Users/thereisnocake/labs/scenario1-health-check/solution

cat > /Users/thereisnocake/labs/scenario1-health-check/exercise.md << 'EOF'
# Scenario 1: Server Health Check Script

## Mission Brief

You're on-call at 03:00. You get a page. You need to know in 3 seconds: is this server healthy or not?

Write a script called `health_check.sh` that checks critical system metrics and tells you PASS, WARN, or FAIL.

## Requirements

Your script MUST:

1. **Check CPU load** — read from `uptime`. If load average (1min) > 2.0, print WARN.
2. **Check disk usage** — use `df -h`. If any filesystem is > 80% used, print WARN.
3. **Check memory** — use `free`. If used memory is > 90% of total, print WARN.
4. **Check critical services** — verify these are active using `systemctl is-active`:
   - `ssh`
   - `cron`
   - `postgresql` (use `postgresql` — if not installed, skip with a note)
5. **Check network** — ping `8.8.8.8` once. If it fails, print WARN.
6. **Log everything** to `/tmp/health_check.log` with a timestamp on each line.
7. **Print a summary** at the end: `PASS`, `WARN`, or `FAIL`.
8. **Exit non-zero** if any check failed.

## Rules

- Start from the script template: `cp ~/labs/shared/script-template.sh health_check.sh`
- Run `shellcheck health_check.sh` before running it — fix all warnings
- Script must be non-destructive (read-only checks only)
- All variables must be quoted

## Hints

```bash
# Get 1-minute load average
load=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | tr -d ' ')

# Get disk usage percentage for root partition
disk=$(df / | awk 'NR==2 {print $5}' | tr -d '%')

# Get memory used percentage
mem_total=$(free | awk '/^Mem:/ {print $2}')
mem_used=$(free  | awk '/^Mem:/ {print $3}')

# Check if a service is active
systemctl is-active --quiet ssh && echo "ssh: OK" || echo "ssh: FAIL"

# Floating point comparison (bash can't do floats natively)
result=$(echo "$load > 2.0" | bc -l)
[[ "$result" -eq 1 ]] && echo "HIGH LOAD"
```

## Testing Your Script

```bash
chmod +x health_check.sh
shellcheck health_check.sh
./health_check.sh
echo "Exit code: $?"
cat /tmp/health_check.log
```

## Expected Output

```
[2026-04-09 03:00:01] Checking CPU load... OK (load: 0.42)
[2026-04-09 03:00:01] Checking disk usage... OK (root: 34%)
[2026-04-09 03:00:01] Checking memory... OK (used: 45%)
[2026-04-09 03:00:01] Checking service ssh... OK
[2026-04-09 03:00:01] Checking service cron... OK
[2026-04-09 03:00:01] Checking service postgresql... OK
[2026-04-09 03:00:01] Checking network... OK
[2026-04-09 03:00:02] RESULT: PASS
```
EOF
```

- [ ] **Step 2: Write the reference solution**

```bash
cat > /Users/thereisnocake/labs/scenario1-health-check/solution/health_check.sh << 'EOF'
#!/bin/bash
set -euo pipefail

LOG="/tmp/health_check.log"
WARN=0

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

check_cpu() {
  local load
  load=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | tr -d ' ')
  local high
  high=$(echo "$load > 2.0" | bc -l)
  if [[ "$high" -eq 1 ]]; then
    log "Checking CPU load... WARN (load: $load)"
    WARN=1
  else
    log "Checking CPU load... OK (load: $load)"
  fi
}

check_disk() {
  local usage
  usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
  if [[ "$usage" -gt 80 ]]; then
    log "Checking disk usage... WARN (root: ${usage}%)"
    WARN=1
  else
    log "Checking disk usage... OK (root: ${usage}%)"
  fi
}

check_memory() {
  local total used pct
  total=$(free | awk '/^Mem:/ {print $2}')
  used=$(free  | awk '/^Mem:/ {print $3}')
  pct=$(( used * 100 / total ))
  if [[ "$pct" -gt 90 ]]; then
    log "Checking memory... WARN (used: ${pct}%)"
    WARN=1
  else
    log "Checking memory... OK (used: ${pct}%)"
  fi
}

check_service() {
  local svc="$1"
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    log "Checking service $svc... OK"
  else
    log "Checking service $svc... FAIL"
    WARN=1
  fi
}

check_network() {
  if ping -c1 -W2 8.8.8.8 > /dev/null 2>&1; then
    log "Checking network... OK"
  else
    log "Checking network... WARN (no outbound connectivity)"
    WARN=1
  fi
}

main() {
  check_cpu
  check_disk
  check_memory
  check_service ssh
  check_service cron
  check_service postgresql || true  # skip if not installed

  check_network

  if [[ "$WARN" -eq 0 ]]; then
    log "RESULT: PASS"
  else
    log "RESULT: WARN/FAIL"
    exit 1
  fi
}

main "$@"
EOF
chmod +x /Users/thereisnocake/labs/scenario1-health-check/solution/health_check.sh
shellcheck /Users/thereisnocake/labs/scenario1-health-check/solution/health_check.sh
```

Expected: no shellcheck warnings

- [ ] **Step 3: Write instructor notes**

```bash
cat > /Users/thereisnocake/labs/scenario1-health-check/instructor-notes.md << 'EOF'
# Instructor Notes — Scenario 1: Health Check

## Key Teaching Moments

1. **bc -l for floats** — bash can't compare floats natively. Students often try `[[ $load > 2.0 ]]` which does string comparison. Show them `bc -l` or `awk`.

2. **`|| true` on optional checks** — `set -e` means the script exits if postgresql isn't installed. The `|| true` pattern suppresses that. Teach this early.

3. **`systemctl is-active --quiet`** — cleaner than parsing `systemctl status` output. Students often try to grep status output which is fragile.

4. **Log before exit, not after** — a common mistake is putting `log "RESULT: FAIL"` after `exit 1`. It never runs. Check for this.

5. **WARN vs FAIL distinction** — encourage students to think about severity levels. A high load is a warning; a service down is a failure. Good sysadmin scripts are nuanced.

## Common Student Mistakes

- Forgetting `local` keyword in functions (pollutes global scope)
- Using `$()` for arithmetic instead of `$(( ))`
- Not quoting variables inside `[[ ]]` — technically safe there but teach the habit anyway
- Piping to `bc` without `-l` flag (needed for float support)
- Writing `exit 1` inside a function — exits the whole script unexpectedly

## Timing

- 5 min: read brief + start writing
- 10 min: most students have basic checks working
- 15 min: wrap up, live-code the solution, highlight the `bc -l` trick
- 20 min: Q&A, show how to add this to cron
EOF
```

---

## Task 5: Scenario 2 — DB Backup Exercise & Solution

**Files:**
- Create: `labs/scenario2-db-backup/exercise.md`
- Create: `labs/scenario2-db-backup/solution/db_backup.sh`
- Create: `labs/scenario2-db-backup/instructor-notes.md`

- [ ] **Step 1: Write student exercise file**

```bash
mkdir -p /Users/thereisnocake/labs/scenario2-db-backup/solution

cat > /Users/thereisnocake/labs/scenario2-db-backup/exercise.md << 'EOF'
# Scenario 2: Automated Database Backup Script

## Mission Brief

Backups run every night via cron. A developer once wrote a backup script that ran successfully — but produced a zero-byte file because `pg_dump` silently failed. Nobody noticed for three weeks.

Write the backup script that ops will actually trust.

## Requirements

Your script `db_backup.sh` MUST:

1. **Accept arguments:**
   - `--db-type` : `postgres` or `mysql`
   - `--db-name` : the database name
   - Example: `./db_backup.sh --db-type postgres --db-name reactor_monitoring`

2. **Create a timestamped backup file:**
   - Format: `/tmp/backups/backup_DBNAME_YYYYMMDD_HHMMSS.sql`
   - Create the `/tmp/backups/` directory if it doesn't exist

3. **Read credentials from environment variables** — never hardcode:
   - Postgres: `$PGPASSWORD` (used automatically by `pg_dump`)
   - MySQL: `$MYSQL_PASS`

4. **Verify the backup** — after running the dump, check the file is non-zero size:
   ```bash
   [[ -s "$backup_file" ]] || die "Backup file is empty — dump failed silently!"
   ```

5. **Rotate old backups** — delete backup files older than 7 days in `/tmp/backups/`:
   ```bash
   find /tmp/backups/ -name "backup_${db_name}_*.sql" -mtime +7 -delete
   ```

6. **Log every step** with timestamp.

7. **Exit non-zero** with a clear message on any failure.

## Rules

- Start from the script template
- Run `shellcheck` before testing
- Never hardcode credentials
- Test with a real local database if available, or mock the dump command

## Argument Parsing Pattern

```bash
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db-type) db_type="$2"; shift 2 ;;
    --db-name) db_name="$2"; shift 2 ;;
    *) die "Unknown argument: $1" ;;
  esac
done
```

## Testing Without a Real Database

```bash
# Simulate a successful dump
pg_dump() { echo "fake dump data" > "$1"; }
export -f pg_dump

# Simulate a failed dump (zero bytes)
pg_dump() { touch "$1"; }
export -f pg_dump
```

## Expected Output

```
[2026-04-09 03:00:01] Starting backup: db=reactor_monitoring type=postgres
[2026-04-09 03:00:01] Creating backup directory /tmp/backups
[2026-04-09 03:00:02] Running pg_dump...
[2026-04-09 03:00:04] Backup created: /tmp/backups/backup_reactor_monitoring_20260409_030002.sql (2.3M)
[2026-04-09 03:00:04] Verifying backup file is non-empty... OK
[2026-04-09 03:00:04] Rotating backups older than 7 days...
[2026-04-09 03:00:04] Rotation complete. Current backups: 4
[2026-04-09 03:00:04] Backup complete: SUCCESS
```
EOF
```

- [ ] **Step 2: Write the reference solution**

```bash
cat > /Users/thereisnocake/labs/scenario2-db-backup/solution/db_backup.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/tmp/backups"
LOG_FILE="/tmp/db_backup.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*"; exit 1; }

parse_args() {
  db_type=""
  db_name=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --db-type) db_type="$2"; shift 2 ;;
      --db-name) db_name="$2"; shift 2 ;;
      *) die "Unknown argument: $1" ;;
    esac
  done
  [[ -n "$db_type" ]] || die "--db-type is required (postgres|mysql)"
  [[ -n "$db_name" ]] || die "--db-name is required"
}

run_backup() {
  local timestamp
  timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="${BACKUP_DIR}/backup_${db_name}_${timestamp}.sql"

  log "Starting backup: db=$db_name type=$db_type"
  mkdir -p "$BACKUP_DIR"
  log "Creating backup directory $BACKUP_DIR"

  case "$db_type" in
    postgres)
      [[ -n "${PGPASSWORD:-}" ]] || die "PGPASSWORD env var is not set"
      log "Running pg_dump..."
      pg_dump -U postgres "$db_name" > "$backup_file"
      ;;
    mysql)
      [[ -n "${MYSQL_PASS:-}" ]] || die "MYSQL_PASS env var is not set"
      log "Running mysqldump..."
      mysqldump -u root -p"${MYSQL_PASS}" "$db_name" > "$backup_file"
      ;;
    *)
      die "Unknown db-type: $db_type (use postgres or mysql)"
      ;;
  esac

  [[ -s "$backup_file" ]] || die "Backup file is empty — dump failed silently!"
  local size
  size=$(du -sh "$backup_file" | cut -f1)
  log "Backup created: $backup_file ($size)"

  log "Rotating backups older than 7 days..."
  find "$BACKUP_DIR" -name "backup_${db_name}_*.sql" -mtime +7 -delete
  local count
  count=$(find "$BACKUP_DIR" -name "backup_${db_name}_*.sql" | wc -l)
  log "Rotation complete. Current backups: $count"

  log "Backup complete: SUCCESS"
}

parse_args "$@"
run_backup
EOF
chmod +x /Users/thereisnocake/labs/scenario2-db-backup/solution/db_backup.sh
shellcheck /Users/thereisnocake/labs/scenario2-db-backup/solution/db_backup.sh
```

Expected: no shellcheck warnings

- [ ] **Step 3: Write instructor notes**

```bash
cat > /Users/thereisnocake/labs/scenario2-db-backup/instructor-notes.md << 'EOF'
# Instructor Notes — Scenario 2: DB Backup

## Key Teaching Moments

1. **The zero-byte trap** — live demo this. Run `pg_dump` against a nonexistent DB without `set -e`. Show the zero-byte file. Then show `[[ -s "$file" ]]` catching it. This lands hard.

2. **`$PGPASSWORD` is magic** — `pg_dump` reads it automatically. Students don't need to pass `-p`. This is how production scripts should work.

3. **`find -mtime +7 -delete`** — safer than `rm $(find ...)`. Explain why: no word-splitting risk, atomic, handles spaces in filenames.

4. **`case` for dispatch** — cleaner than chained `if/elif` for DB type routing. Good pattern for any script with modes.

5. **`mkdir -p` is idempotent** — safe to call even if directory exists. No need to check first.

## Common Student Mistakes

- Using `$()` to capture `pg_dump` output instead of redirecting to file
- Hardcoding passwords "just for testing" — enforce the rule from day one
- Forgetting to check `$PGPASSWORD` is set before running dump
- Using `ls | wc -l` to count files instead of `find | wc -l` (breaks on spaces)

## Timing

- 5 min: read brief, start with argument parsing
- 12 min: most have the core backup loop working
- 18 min: wrap up, live-code the zero-byte verification demo
- 20 min: show how to schedule in cron: `0 3 * * * /usr/local/bin/db_backup.sh --db-type postgres --db-name reactor_monitoring`
EOF
```

---

## Task 6: Scenario 3 — Incident Response Exercise & Solution

**Files:**
- Create: `labs/scenario3-incident-response/exercise.md`
- Create: `labs/scenario3-incident-response/solution/analyze.sh`
- Create: `labs/scenario3-incident-response/instructor-notes.md`

- [ ] **Step 1: Write student exercise file**

```bash
mkdir -p /Users/thereisnocake/labs/scenario3-incident-response/solution

cat > /Users/thereisnocake/labs/scenario3-incident-response/exercise.md << 'EOF'
# Scenario 3: Incident Response — Log Analysis

## Mission Brief

It's 07:00. You've just been handed this message:

> "Something went wrong with reactor-srv1 around 03:00 last night. The monitoring service went down for ~5 minutes. Find out what happened."

The log file is at: `~/labs/shared/incident.log`

**You must investigate — without making anything worse.**

## The Rules

- **READ ONLY.** Do not restart services, delete files, or modify anything.
- All output goes to `~/incident_report.txt`
- Use only pipes and text tools — no scripts needed for this one

## Tasks

Work through these in order. Write each command and its output into `~/incident_report.txt`.

### Task A — Error Overview
Count how many lines contain each severity level (ERROR, FATAL, CRITICAL, WARN).
```bash
# Hint: grep -c, or grep | sort | uniq -c
```

### Task B — Incident Time Window
Find the timestamp of the **first** error and the **last** error.
```bash
# Hint: grep "ERROR\|FATAL\|CRITICAL" incident.log | head -1
#        grep "ERROR\|FATAL\|CRITICAL" incident.log | tail -1
```

### Task C — Authentication Failures
Which IP address was responsible for authentication failures? How many attempts?
```bash
# Hint: grep "Failed password" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c
```

### Task D — Postgres Errors
List all unique postgres error messages, sorted by frequency (most common first).
```bash
# Hint: grep "postgres" | grep -E "ERROR|FATAL" | awk -F'] ' '{print $2}' | sort | uniq -c | sort -rn
```

### Task E — Write the Incident Summary
Create `~/incident_report.txt` with this structure:
```
INCIDENT REPORT — reactor-srv1
Date: 2026-04-09
Investigated by: <your name>

TIME WINDOW:
  First error: <timestamp>
  Last error:  <timestamp>
  Duration:    ~5 minutes

ROOT CAUSE (your assessment):
  <2-3 sentences based on what you found>

ERRORS BY SEVERITY:
  FATAL:    <count>
  CRITICAL: <count>
  ERROR:    <count>

SUSPICIOUS IP: <ip> (<count> auth failure attempts)

TOP POSTGRES ERRORS:
  1. <most common>
  2. <second>
  3. <third>
```

## Expected Findings

You should find:
- A connection limit exhaustion event at 03:00:02
- An OOM kill of a postgres process at 03:00:13
- A monitoring service outage from 03:00:15 to 03:05:02
- 10+ auth failures from a single IP (192.168.1.200)
EOF
```

- [ ] **Step 2: Write reference solution commands**

```bash
cat > /Users/thereisnocake/labs/scenario3-incident-response/solution/analyze.sh << 'EOF'
#!/bin/bash
# Reference solution — commands students should arrive at
# This is NOT a script to run directly — it's instructor reference

LOG="$HOME/labs/shared/incident.log"

echo "=== Task A: Error counts by severity ==="
for level in ERROR FATAL CRITICAL WARN; do
  count=$(grep -c "$level" "$LOG" || true)
  echo "  $level: $count"
done

echo ""
echo "=== Task B: Time window ==="
echo "First error:"
grep -E "ERROR|FATAL|CRITICAL" "$LOG" | head -1 | awk '{print $1, $2, $3}'
echo "Last error:"
grep -E "ERROR|FATAL|CRITICAL" "$LOG" | tail -1 | awk '{print $1, $2, $3}'

echo ""
echo "=== Task C: Auth failure IPs ==="
grep "Failed password" "$LOG" \
  | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' \
  | sort | uniq -c | sort -rn

echo ""
echo "=== Task D: Postgres errors by frequency ==="
grep "postgres" "$LOG" \
  | grep -E "ERROR|FATAL" \
  | awk -F'] ' '{print $NF}' \
  | sort | uniq -c | sort -rn \
  | head -10
EOF
chmod +x /Users/thereisnocake/labs/scenario3-incident-response/solution/analyze.sh
shellcheck /Users/thereisnocake/labs/scenario3-incident-response/solution/analyze.sh
```

- [ ] **Step 3: Write instructor notes**

```bash
cat > /Users/thereisnocake/labs/scenario3-incident-response/instructor-notes.md << 'EOF'
# Instructor Notes — Scenario 3: Incident Response

## Key Teaching Moments

1. **Read before you act** — the read-only constraint is intentional. In real nuclear ops, touching a running system during an incident without authorization can make things worse and creates audit trail problems.

2. **`grep -oE` for extraction** — students often try to copy-paste IP addresses by hand. Show `grep -oE` with a regex to extract structured data from unstructured logs.

3. **Pipe chains tell a story** — the postgres error pipeline (`grep | grep | awk | sort | uniq -c | sort -rn`) is a pattern they'll use forever. Walk through it pipe by pipe.

4. **Root cause reasoning** — the log tells a clear story: connection limit hit → app retries → OOM kill → postgres crash → monitoring down. Students may miss the causal chain. Walk them through it.

5. **The suspicious IP** — 192.168.1.200 was brute-forcing SSH during the incident. This may or may not be related (likely coincidence here, but teach them to note it). Correlation vs causation.

## What Students Should Conclude

Root cause: Postgres hit its connection limit (100 connections) at 03:00:02, likely due to a connection pool leak or runaway query. This caused the monitoring app to fail, which was then OOM-killed by the kernel. Service recovered at 03:05:02 after automatic restart.

Secondary finding: SSH brute force from 192.168.1.200 — should be reported to security team regardless of incident relationship.

## Common Student Mistakes

- Trying to restart services (remind them: read-only)
- Using `cat | grep` instead of `grep file` directly
- Not using `-E` flag for multi-pattern grep (ERROR|FATAL won't work without it)
- Forgetting `|| true` after `grep -c` when using `set -e` (grep exits 1 if no match)

## Timing

- 3 min: read the brief
- 10 min: work through tasks A-D independently
- 13 min: most have findings, start writing the report
- 15 min: instructor walks through full solution, explains the causal chain
EOF
```

---

## Task 7: Final Verification

- [ ] **Step 1: Verify all files were created**

```bash
find /Users/thereisnocake/labs -type f | sort
```

Expected output:
```
/Users/thereisnocake/labs/scenario1-health-check/exercise.md
/Users/thereisnocake/labs/scenario1-health-check/instructor-notes.md
/Users/thereisnocake/labs/scenario1-health-check/solution/health_check.sh
/Users/thereisnocake/labs/scenario2-db-backup/exercise.md
/Users/thereisnocake/labs/scenario2-db-backup/instructor-notes.md
/Users/thereisnocake/labs/scenario2-db-backup/solution/db_backup.sh
/Users/thereisnocake/labs/scenario3-incident-response/exercise.md
/Users/thereisnocake/labs/scenario3-incident-response/instructor-notes.md
/Users/thereisnocake/labs/scenario3-incident-response/solution/analyze.sh
/Users/thereisnocake/labs/shared/cheatsheet.md
/Users/thereisnocake/labs/shared/incident.log
/Users/thereisnocake/labs/shared/script-template.sh
```

- [ ] **Step 2: Verify all shell scripts pass shellcheck**

```bash
shellcheck /Users/thereisnocake/labs/shared/script-template.sh
shellcheck /Users/thereisnocake/labs/scenario1-health-check/solution/health_check.sh
shellcheck /Users/thereisnocake/labs/scenario2-db-backup/solution/db_backup.sh
shellcheck /Users/thereisnocake/labs/scenario3-incident-response/solution/analyze.sh
```

Expected: no output (zero warnings on all scripts)

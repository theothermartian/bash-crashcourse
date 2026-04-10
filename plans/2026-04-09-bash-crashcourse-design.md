# Bash Crashcourse Design — 4-Hour Sysadmin/DBA Training
**Date:** 2026-04-09
**Audience:** CS-background students becoming sysadmins/DBAs on a nuclear project
**Environment:** Ubuntu, live lab VMs
**Goal:** Students can read/execute existing bash scripts AND write their own sysadmin scripts

---

## Prerequisites & Lab Setup (Instructor Prep)

- Each student has a dedicated Ubuntu VM with `sudo` access
- Lab 6 requires a **second Ubuntu VM** reachable by SSH from the first — provision this in advance
- Scenario 3 requires a pre-built **`incident.log`** file (~500 lines, mixed syslog/postgres/auth entries with injected errors) — instructor creates and distributes before Part 2
- `shellcheck`, `htop`, `postgresql-client`, `mysql-client` should be pre-installed or students install them in Lab 5
- Estimated pacing: Part 1 modules total ~2h40min + ~20min buffer for questions/transitions = 3h solid

---

## Overall Structure

| Block | Duration | Content |
|---|---|---|
| Part 1 | ~3 hours | Practical tools + scripting concepts |
| Part 2 | ~1 hour | Scenario-driven exercises |

**Delivery format:** Each module = short lecture/demo → immediate hands-on lab on Ubuntu VM. No module longer than 20 min without a lab checkpoint.

**Safety framing:** Every module opens with one "this can kill a system" warning relevant to that topic. Woven in throughout, not a standalone lecture.

---

## Part 1: Practical Tools & Scripting (3 hours)

---

### Module 1 — Bash Fundamentals & The Nuclear Mindset (20 min)

**Concepts:**
- What makes bash different from Python/Java (whitespace matters, exit codes are backwards, no types)
- The standard script header — every script they ever write starts with this:
  ```bash
  #!/bin/bash
  set -euo pipefail
  ```
- Exit codes: `0` = success, non-zero = failure (opposite of most languages)
- Quoting law: **always** `"$var"` never `$var` — unquoted vars can silently destroy systems
- `shellcheck` — mandatory linter, run it before executing any script
- The nuclear rule: **dry-run first, backup before destructive ops, never run as root unless necessary**

**Lab 1:** Write a 5-line script with the header, a variable, and an echo. Run `shellcheck` on it. Deliberately introduce a quoting bug — shellcheck catches it.

---

### Module 2 — Navigation & File Operations (20 min)

**Commands:**
```
pwd  cd  ls -la  find
cp -r  mv  rm (safe patterns)  mkdir -p
chmod  chown  chgrp  ln -s
```

**Key safety demo:** `rm -rf $dir/*` with empty `$dir` → wipes current directory. Show it on a throwaway dir. Then show the fix:
```bash
[[ -n "$dir" ]] || { echo "ERROR: dir is empty"; exit 1; }
```

**File testing operators:** `-f`, `-d`, `-x`, `-e`, `-s`

**Lab 2:** Navigate a provided directory tree, find files by extension using `find`, fix permissions on a broken script, create a symlink.

---

### Module 3 — Text Processing & Pipes (20 min)

**Commands:**
```
cat  less  head  tail -f
grep -r -E -i  wc  sort  uniq -c
cut -d -f  tr  awk '{print $1}'  sed 's/old/new/g'
```

**Redirection:**
```bash
cmd > file       # stdout to file (overwrites)
cmd >> file      # append
cmd 2> errors    # stderr only
cmd 2>&1         # merge stderr into stdout
cmd | next       # pipe
cmd > /dev/null  # silence
```

**Lab 3:** Given a sample `/var/log/syslog`, find all ERROR lines, count unique IPs, extract timestamps — using pipes only.

---

### Module 4 — Process & System Management (25 min)

**Commands:**
```
ps aux  pgrep  pkill  kill  kill -9
top  htop  df -h  du -sh  free -h  uptime
systemctl start|stop|status|enable|disable|restart
journalctl -u servicename -f --since "1 hour ago"
ss -tulpn  who  w  last  lsof -i :port
crontab -e  (cron syntax: * * * * *)
```

**Key safety demo:** `kill -9` vs `kill -15` — why SIGTERM first matters for databases (dirty shutdown = corrupted state).

**Lab 4:** Find a running process, check what port it's listening on, restart a service, read its last 50 journal lines, schedule a cron job to log disk usage every minute.

---

### Module 5 — Users, Permissions & Packages (15 min)

**Commands:**
```
useradd -m -s /bin/bash  usermod -aG  userdel
passwd  groups  id  sudo  su -
chmod 750 / chmod u+x  chown user:group  umask
apt update && apt upgrade  apt install  apt remove  dpkg -l
```

**Key point:** chmod numeric (`755`, `640`, `600`) vs symbolic. In nuclear systems: principle of least privilege, document every `sudo` operation.

**Lab 5:** Create a user, add to a group, set correct permissions on a config file, install `htop` and `shellcheck` via apt.

---

### Module 6 — Networking & Remote Operations (15 min)

**Commands:**
```
ip addr  ip route  ping  curl -X GET/POST
ssh user@host  scp file user@host:/path
rsync -avz --dry-run src/ dest/
ss -tulpn  ufw status  ufw allow/deny
wget  nc  host  dig
```

**Key safety demo:** Always `rsync --dry-run` first before syncing anything in production.

**Lab 6:** SSH into a second VM, copy a file with `scp`, rsync a directory with dry-run, check what ports are open.

---

### Module 7 — Bash Scripting Essentials (30 min)

```bash
# Variables & special vars
name="reactor-1"
echo "$name"
echo "$0 $1 $@ $# $? $$"

# Parameter expansion
echo "${name:-default}"    # default if unset
echo "${name^^}"           # uppercase
echo "${#name}"            # length

# Command substitution
now=$(date +%Y%m%d)

# Conditionals — always [[ ]]
if [[ "$1" == "start" ]]; then
  echo "starting"
elif [[ "$count" -gt 10 ]]; then
  echo "too many"
fi

# Loops
for file in /var/log/*.log; do
  echo "Processing: $file"
done

while [[ "$status" != "ready" ]]; do
  sleep 5
  status=$(check_status)
done

# Functions
backup_db() {
  local db_name="$1"
  local dest="$2"
  pg_dump "$db_name" > "$dest" || { echo "Backup failed"; exit 1; }
}

# Error handling
trap 'echo "ERROR at line $LINENO"; exit 1' ERR
cleanup() { rm -f /tmp/lockfile; }
trap cleanup EXIT

# Arithmetic
count=$(( count + 1 ))
```

**Lab 7:** Write a parameterized script that accepts a service name, checks if it's running, restarts it if not, and logs the result to a file with a timestamp.

---

### Module 8 — Database Admin Bash (15 min)

**PostgreSQL:**
```bash
psql -U postgres -c "SELECT version();"
pg_dump -U postgres mydb > backup_$(date +%Y%m%d).sql
pg_restore -U postgres -d mydb backup.sql
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**MySQL/MariaDB:**
```bash
mysql -u root -p"$MYSQL_PASS" -e "SHOW DATABASES;"
mysqldump -u root -p"$MYSQL_PASS" mydb > backup.sql
mysql -u root -p"$MYSQL_PASS" mydb < backup.sql
```

**Oracle:**
```bash
sqlplus -s user/pass@//host:1521/SID <<EOF
SELECT status FROM v\$instance;
EXIT;
EOF
expdp user/pass DIRECTORY=dmpdir DUMPFILE=export.dmp
```

**Key pattern:** Store credentials in env vars or `.pgpass`/`.my.cnf`, **never hardcode in scripts**.

**Lab 8:** Write a one-shot health check that connects to Postgres, counts active connections, and exits non-zero if over a threshold.

---

## Part 2: Scenario-Driven Practice (1 hour)

Each scenario has a mission brief, students build on their Ubuntu VM, instructor live-codes alongside.

---

### Scenario 1 — Server Health Check Script (20 min)

**Mission brief:** "You're on-call. Write a script that tells you in 3 seconds whether this server is healthy or needs attention."

**Students build a script that:**
- Checks CPU load (`uptime`, warn if > 2.0)
- Checks disk usage (`df -h`, warn if any partition > 80%)
- Checks memory (`free -h`, warn if used > 90%)
- Checks 3 critical services are active (`systemctl is-active postgresql ssh cron`)
- Checks outbound connectivity (`ping -c1 8.8.8.8`)
- Logs all results to `/var/log/health_check.log` with timestamp
- Exits non-zero if ANY check fails
- Prints a clear PASS / WARN / FAIL summary

**Safety concepts reinforced:** `set -euo pipefail`, guard checks, non-destructive read-only operations

**Reference solution structure:**
```bash
#!/bin/bash
set -euo pipefail

LOG="/var/log/health_check.log"
FAIL=0

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

check_cpu() { ... }
check_disk() { ... }
check_memory() { ... }
check_services() { ... }
check_network() { ... }

check_cpu && check_disk && check_memory && check_services && check_network
[[ "$FAIL" -eq 0 ]] && log "PASS" || { log "FAIL"; exit 1; }
```

---

### Scenario 2 — Automated DB Backup Script (20 min)

**Mission brief:** "Backups run every night. Write the script that ops will actually schedule in cron."

**Students build a script that:**
- Accepts `--db-type` (postgres/mysql) and `--db-name` as arguments
- Creates a timestamped backup: `backup_DBNAME_YYYYMMDD_HHMMSS.sql`
- Reads credentials from environment variables (`$PGPASSWORD`, `$MYSQL_PASS`) — never hardcoded
- Verifies backup file is non-zero size after creation
- Rotates backups: deletes files older than 7 days in the backup dir
- Logs every step with timestamp
- Exits non-zero on any failure with a clear message

**Safety concepts reinforced:** credential handling, post-op verification, never `rm` without guard

**Key teaching moment:** Show what happens when `pg_dump` silently fails without `set -euo pipefail` — zero-byte backup file, no warning, false confidence.

---

### Scenario 3 — Incident Response: Log Analysis (15 min)

**Mission brief:** "Something went wrong at 03:00. You have the logs. Find out what happened — without making it worse."

**Setup:** Instructor provides a pre-built `incident.log` containing mixed syslog, postgres, and auth entries with injected errors.

**Students must:**
- Find all FATAL/ERROR/CRITICAL lines and count by type
- Identify the time window of the incident (first error → last error)
- Find which user/IP triggered authentication failures
- Extract postgres errors and sort by frequency
- Output a 5-line incident summary to a file

**Constraint:** Read-only. No writing to system dirs. No restarting services. Teaches the mindset: investigate before acting.

**Commands used:** `grep`, `awk`, `sort`, `uniq -c`, `cut`, `head`, `tail`, pipes — the full Part 1 toolkit under pressure.

---

### Wrap-up (5 min)

- Hand out the **reference cheat sheet** (one-page: commands, safety rules, script template)
- Remind: `shellcheck` before running anything you didn't write yourself
- What's next: Ansible, Python for automation, Linux Foundation sysadmin cert (LFCS)
- Q&A

---

## Safety Principles (woven throughout)

- `set -euo pipefail` on every script
- Always quote variables: `"$var"`
- Dry-run before destructive operations
- Never `rm -rf` without guard checks
- `shellcheck` before executing any script
- `kill -15` before `kill -9` for databases
- Never hardcode credentials
- Principle of least privilege — document all `sudo` usage
- Rollback plan before any production operation

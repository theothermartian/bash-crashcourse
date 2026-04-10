# Lab 8: Database Health Check Script

**Module:** 8 — Database Admin Bash
**Time:** 10 minutes
**VM:** vm1 (with PostgreSQL running — instructor pre-configured)

---

## Objective

Write a script that connects to PostgreSQL, counts active connections, and exits non-zero with an alert message if the count exceeds a configurable threshold.

---

## Pre-check — verify PostgreSQL is running

```bash
systemctl is-active postgresql
psql -U postgres -c "SELECT version();" 2>/dev/null || echo "NOTE: Need sudo -u postgres"
```

If you get a permission error, use:
```bash
sudo -u postgres psql -c "SELECT version();"
```

Note which invocation works on your VM — use that form in your script.

---

## Step 1: Explore the database first

Run these queries to understand what you'll be monitoring:
```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity;"
sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datistemplate = false;"
```

Note the difference between the output of the first and second command. The `-t` flag removes headers — this is what you need for scripting.

---

## Step 2: Write the health check script

```bash
mkdir -p ~/crashcourse/lab8
nano ~/crashcourse/lab8/pg_health.sh
```

Write the following:

```bash
#!/bin/bash
set -euo pipefail

# --- Configuration ---
DB_USER="postgres"
THRESHOLD="${PG_CONN_THRESHOLD:-20}"   # default 20; override via env var
LOG_FILE="/var/log/crashcourse/pg_health.log"

# --- Functions ---
log_msg() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "${ts} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

# --- Check PostgreSQL is reachable ---
if ! sudo -u "$DB_USER" psql -c "SELECT 1;" &>/dev/null; then
  log_msg "ERROR" "Cannot connect to PostgreSQL"
  exit 1
fi

# --- Count active connections ---
conn_count=$(sudo -u "$DB_USER" psql -t -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" \
  | tr -d ' \n')

# Validate the result is numeric
[[ "$conn_count" =~ ^[0-9]+$ ]] || {
  log_msg "ERROR" "Unexpected output from pg_stat_activity: '$conn_count'"
  exit 1
}

# --- Evaluate threshold ---
if [[ "$conn_count" -gt "$THRESHOLD" ]]; then
  log_msg "WARN" "Active connections: ${conn_count} (threshold: ${THRESHOLD}) — ALERT"
  exit 1
fi

log_msg "INFO" "Active connections: ${conn_count} (threshold: ${THRESHOLD}) — OK"
exit 0
```

Save and exit.

---

## Step 3: shellcheck and test

```bash
shellcheck ~/crashcourse/lab8/pg_health.sh
chmod +x ~/crashcourse/lab8/pg_health.sh
```

Run with default threshold:
```bash
~/crashcourse/lab8/pg_health.sh
echo "Exit code: $?"
```

Run with a very low threshold to trigger the alert:
```bash
PG_CONN_THRESHOLD=0 ~/crashcourse/lab8/pg_health.sh
echo "Exit code: $?"
```

Check the log file:
```bash
cat /var/log/crashcourse/pg_health.log
```

---

## Step 4: Make it schedulable via cron

Add the health check to cron to run every 5 minutes:
```bash
crontab -e
```

Add:
```
*/5 * * * * /home/student/crashcourse/lab8/pg_health.sh >> /var/log/crashcourse/pg_health.log 2>&1
```

Note: the script already logs internally — but the cron redirect here captures any unexpected stderr that bypasses the log function.

Remove the cron entry after confirming it works:
```bash
crontab -e
```

---

## Checkpoint

Before moving on, confirm:
- [ ] You can connect to PostgreSQL and retrieve the active connection count
- [ ] The script exits 0 when connections are below threshold
- [ ] The script exits 1 when connections exceed threshold
- [ ] shellcheck passes with no warnings
- [ ] The log file shows timestamped output from multiple runs

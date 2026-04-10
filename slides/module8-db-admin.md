# Module 8 — Database Admin Bash
**Duration:** 15 min (10 min lecture + 10 min Lab 8)

---

## Slide 8-1: The Safety Warning

> "Never hardcode database credentials in a script. Scripts end up in git repositories. Git repositories end up being accidentally public. Credentials in git are compromised credentials. Store them in environment variables, `.pgpass`, or `.my.cnf` with `600` permissions — and ensure those files are excluded from version control."

---

## Slide 8-2: Credentials — The Right Way

```bash
# WRONG — never do this
psql -U postgres -p "mysecretpassword" -c "SELECT 1;"

# RIGHT — environment variable
export PGPASSWORD="$PGPASSWORD"   # set externally, not hardcoded
psql -U postgres -c "SELECT 1;"

# RIGHT — .pgpass file (postgres-native)
# ~/.pgpass format: hostname:port:database:username:password
# chmod 600 ~/.pgpass
echo "localhost:5432:*:postgres:$PGPASSWORD" >> ~/.pgpass
chmod 600 ~/.pgpass

# RIGHT — .my.cnf for MySQL
# ~/.my.cnf
# [client]
# user=root
# password=YOURPASS   ← set to actual value, chmod 600 ~/.my.cnf
```

---

## Slide 8-3: PostgreSQL Operations

```bash
# Check version and connectivity
psql -U postgres -c "SELECT version();"

# List databases
psql -U postgres -c "\l"
# or
psql -U postgres -c "SELECT datname FROM pg_database;"

# Count active connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -U postgres -c "
  SELECT pid, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND query_start IS NOT NULL
  ORDER BY duration DESC LIMIT 10;"

# Backup
pg_dump -U postgres mydb > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore
psql -U postgres -d mydb < backup.sql
```

---

## Slide 8-4: MySQL/MariaDB Operations

```bash
# Check connectivity (credentials in .my.cnf)
mysql -e "SELECT version();"
mysql -e "SHOW DATABASES;"

# Backup
mysqldump mydb > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore
mysql mydb < backup.sql

# Check process list
mysql -e "SHOW PROCESSLIST;"

# Check running connections
mysql -e "SHOW STATUS LIKE 'Threads_connected';"
```

---

## Slide 8-5: Oracle (sqlplus)

```bash
# Connect and run query — note: credential via env var, never hardcoded
sqlplus -s user/"$ORACLE_PASS"@//host:1521/ORCL <<EOF
SET PAGESIZE 0 FEEDBACK OFF VERIFY OFF HEADING OFF ECHO OFF;
SELECT status FROM v\$instance;
EXIT;
EOF

# Check exit code
status=$(sqlplus -s ... <<EOF
...
EOF
)
[[ $? -eq 0 ]] || { echo "Oracle query failed"; exit 1; }

# Data pump export
expdp user/"$ORACLE_PASS" \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE="export_$(date +%Y%m%d).dmp" \
  LOGFILE="export_$(date +%Y%m%d).log"
```

---

## Slide 8-6: The Health Check Pattern

```bash
#!/bin/bash
set -euo pipefail

THRESHOLD=50   # max acceptable connections
DB_USER="postgres"

conn_count=$(psql -U "$DB_USER" -t -c "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')

if [[ "$conn_count" -gt "$THRESHOLD" ]]; then
  echo "ALERT: $conn_count active connections (threshold: $THRESHOLD)"
  exit 1
fi

echo "OK: $conn_count active connections"
exit 0
```

- `-t` flag: tuples only (no headers, no row count) — machine-readable output
- `tr -d ' '` strips whitespace from psql output
- Exit code convention: `0` = healthy, `1` = alert. Monitoring systems depend on this.

---

## Slide 8-7: Backup Best Practices

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/postgres"
DB_NAME="reactor_ops"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Ensure backup dir exists
[[ -d "$BACKUP_DIR" ]] || mkdir -p "$BACKUP_DIR"

# Backup
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" \
  || { echo "ERROR: pg_dump failed"; exit 1; }

# Verify backup is non-empty
[[ -s "$BACKUP_FILE" ]] \
  || { echo "ERROR: backup file is empty"; rm -f "$BACKUP_FILE"; exit 1; }

echo "Backup completed: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql" -mtime +${RETENTION_DAYS} -delete
echo "Pruned backups older than $RETENTION_DAYS days"
```

---

## Instructor Notes

**Timing:** 10 min lecture, 10 min lab. Final module — energy may be low. Keep demos tight and focus on the patterns.

**Pre-session setup required:**
- PostgreSQL must be running: `sudo systemctl start postgresql`
- The `postgres` system user must be able to run `psql` without password (default on Ubuntu)
- Ensure `/var/log/crashcourse/` exists with student write permissions (from Lab 7)

**What to emphasize:**
- The `-t` flag for machine-readable psql output. Most important psql flag for scripting.
- Credential storage pattern: environment variables and `.pgpass`. Every database credential in scripts must use this.
- Exit code conventions for health checks: 0=OK, 1=warning/critical. Monitoring systems (Nagios, Zabbix, custom) all follow this convention.

**Common student mistakes:**
- Not stripping whitespace from psql output — the comparison `"$conn_count" -gt 20` fails because `conn_count` has leading/trailing spaces
- Hardcoding the postgres user password in the script
- Not checking if PostgreSQL is reachable before querying it
- Using `$()` to capture psql output that includes a trailing empty line — the `tr -d ' \n'` strips it

**For faster students:** Have them add a check for long-running queries (over 60 seconds) and report those as a separate exit code or log line.

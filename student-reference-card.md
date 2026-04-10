# Student Reference Card — Bash Crashcourse

> Print double-sided. Keep it with you during labs and Part 2 exercises.

---

## FRONT — Commands Quick Reference

### Navigation (Module 2)
```
pwd                    where am I?
ls -la                 list all files with permissions
cd /path               go to absolute path
cd -                   go to previous directory
find /path -name "*.log" -type f   find files
find /path -mtime -1   modified in last 24 hours
```

### Permissions (Module 2 & 5)
```
chmod 600 file         owner read/write only (credentials)
chmod 640 file         owner rw, group r
chmod 750 file         owner rwx, group rx
chmod +x file          make executable
chown user:group file  change ownership
```

### Text Processing (Module 3)
```
cat / less / head -20 / tail -20 / tail -f
grep "ERROR" file             find matching lines
grep -E "ERR|WARN" file       multiple patterns
grep -c "ERROR" file          count matches
grep -A 3 "ERROR" file        3 lines after match
awk '{print $2}' file         print column 2
awk -F: '{print $1}' file     awk with delimiter
sort | uniq -c | sort -rn     frequency count (use this daily)
wc -l file                    count lines
sed 's/old/new/g' file        replace text (cp file file.bak first!)
```

### Redirection (Module 3)
```
cmd > file             stdout to file (overwrites)
cmd >> file            stdout append
cmd 2> err.log         stderr only
cmd > out.log 2>&1     both stdout+stderr to file
cmd1 | cmd2            pipe output to next command
```

### Processes (Module 4)
```
ps aux | grep name     find a process
pgrep -a name          find PID by name
kill -15 PID           SIGTERM (try first!)
kill -9 PID            SIGKILL (last resort — never on DB without -15 first)
df -h                  disk usage
free -h                memory
uptime                 load averages
```

### Services (Module 4)
```
systemctl status svc   check service health
systemctl start svc    start
systemctl stop svc     stop
systemctl restart svc  restart
systemctl is-active svc   returns 0 if running
journalctl -u svc -n 50  last 50 log lines
journalctl -u svc -f     follow live
```

### Users & Packages (Module 5)
```
useradd -m -s /bin/bash user   create user
usermod -aG group user          add to group (the -a is critical!)
userdel user                    delete user (keeps home)
id user                         show UID/GID/groups
sudo -l                         what can I sudo?
sudo apt update && sudo apt install pkg
```

### Networking (Module 6)
```
ip addr                  show IPs
ping -c 4 host           test connectivity
ss -tulpn                listening ports with PIDs
ssh user@host            connect
scp file user@host:/path copy file to remote
rsync -avz --dry-run src/ dest/   DRY RUN FIRST!
rsync -avz src/ dest/    sync (run after dry-run)
```

### Database (Module 8)
```
sudo -u postgres psql -c "SELECT version();"
sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity;"
pg_dump -U postgres mydb > backup_$(date +%Y%m%d_%H%M%S).sql
psql -U postgres -d mydb < backup.sql
mysql -e "SHOW DATABASES;"
mysqldump mydb > backup.sql
```

---

## BACK — Scripting Patterns

### Standard Script Header (every script, no exceptions)
```bash
#!/bin/bash
set -euo pipefail
```

### Log function + Die function
```bash
LOG_FILE="${LOG_FILE:-/tmp/script.log}"

log_msg() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "${ts} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

die() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: $*" >&2
  exit 1
}
```

### Argument validation
```bash
[[ "$#" -eq 1 ]] || { echo "Usage: $0 <arg>"; exit 1; }
SERVICE="$1"
[[ "$SERVICE" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Invalid service name: $SERVICE"
```

### rm guard pattern (always before rm -rf)
```bash
[[ -n "$target_dir" ]] || die "target_dir is empty — aborting delete"
rm -rf "$target_dir"
```

### File test guards
```bash
[[ -f "$file" ]] || die "File not found: $file"
[[ -d "$dir" ]] || mkdir -p "$dir"
[[ -s "$backup" ]] || die "Backup file is empty: $backup"
```

### Trap pattern
```bash
cleanup() { rm -f /tmp/mylockfile; }
trap cleanup EXIT
trap 'die "Script failed at line $LINENO"' ERR
```

### Service health check pattern
```bash
if systemctl is-active --quiet "$SERVICE"; then
  log_msg "INFO" "${SERVICE}: OK"
else
  log_msg "WARN" "${SERVICE}: not running — attempting restart"
  sudo systemctl restart "$SERVICE" \
    && log_msg "INFO" "${SERVICE}: RESTARTED" \
    || die "${SERVICE}: restart FAILED"
fi
```

### PostgreSQL health check pattern
```bash
conn_count=$(sudo -u postgres psql -t -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" \
  | tr -d ' \n')
[[ "$conn_count" =~ ^[0-9]+$ ]] || die "Non-numeric output: $conn_count"
[[ "$conn_count" -gt "$THRESHOLD" ]] && {
  log_msg "WARN" "Connections: $conn_count (threshold: $THRESHOLD)"
  exit 1
}
log_msg "INFO" "Connections: $conn_count — OK"
```

### Backup pattern
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"
pg_dump -U postgres "$DB_NAME" > "$BACKUP_FILE" || die "pg_dump failed"
[[ -s "$BACKUP_FILE" ]] || die "Backup is empty"
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql" -mtime +7 -delete
```

---

## The Nuclear Rules

1. `set -euo pipefail` — every script
2. `shellcheck` — before executing any script
3. Quote variables: `"$var"` not `$var`
4. Guard before `rm -rf` — check the variable is non-empty
5. `--dry-run` before rsync, especially with `--delete`
6. Backup before modifying (`cp file file.bak`)
7. `kill -15` before `kill -9` — especially for databases
8. Never hardcode credentials — use env vars or `.pgpass`/`.my.cnf` (`chmod 600`)
9. Document every `sudo` — "I needed to" is not a justification
10. If you don't know what a command does — do not run it

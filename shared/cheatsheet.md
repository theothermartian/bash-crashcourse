# Bash Sysadmin Cheat Sheet — Nuclear Facility Edition

## ☢️ NUCLEAR RULES (Read Before Every Lab)

1. **ALWAYS start scripts with:** `set -euo pipefail`
2. **ALWAYS quote variables:** `"$var"` not `$var`
3. **ALWAYS dry-run first:** Add `--dry-run`, `--verbose`, or `echo` before real commands
4. **ALWAYS run shellcheck:** `shellcheck script.sh` before production
5. **ALWAYS kill -15 first:** Use SIGTERM before SIGKILL. Never jump to -9.
6. **NEVER hardcode credentials:** Use env vars, config files, or secret managers
7. **ALWAYS have rollback plan:** Know how to undo before pressing Enter

---

## Every Script Starts With

```bash
#!/bin/bash
set -euo pipefail  # exit on error, undefined vars, pipe failures
IFS=$'\n\t'        # safer word splitting
```

---

## Navigation

| Command | Purpose |
|---------|---------|
| `pwd` | Print working directory |
| `cd /path/to/dir` | Change directory (absolute or relative) |
| `cd -` | Return to previous directory |
| `cd ~` | Go to home directory |
| `ls -la` | List all files with details (hidden too) |
| `find /path -name "*.log"` | Find files by name pattern |
| `find /path -type f -mtime -7` | Find files modified in last 7 days |
| `find /path -type d -empty` | Find empty directories |

---

## File Operations (BE CAREFUL!)

| Command | Purpose | Example |
|---------|---------|---------|
| `cp -r source dest` | Copy (recursive) | `cp -r /etc/app /backup/app` |
| `mv old new` | Move/rename | `mv app.log app.bak` |
| `rm file` | Delete file | `rm old.log` |
| `rm -r dir` | Delete directory recursively | `rm -r /tmp/junk` |
| `mkdir -p /a/b/c` | Create nested dirs | `mkdir -p /var/myapp/logs` |
| `chmod 755 file` | Set permissions | `chmod 755 script.sh` |
| `chown user:group file` | Change owner | `chown postgres:postgres db.conf` |
| `touch file` | Create empty file or update timestamp | `touch /var/log/new.log` |

**DANGER:** `rm -r` is permanent. Always guard it:

```bash
[[ -n "$dir" && -d "$dir" ]] || { echo "ERROR: dir is empty or not a directory"; exit 1; }
rm -r "$dir"
```

---

## Safety Before rm — The Guard Pattern

```bash
# ALWAYS use this pattern before destructive commands:
target="/path/to/delete"

# Guard: check variable is not empty and path exists
[[ -n "$target" ]] || { echo "ERROR: target is empty"; exit 1; }
[[ -e "$target" ]] || { echo "ERROR: target does not exist"; exit 1; }

# Optional: show what you're deleting
echo "Deleting: $target"
ls -la "$target"
read -p "Continue? (y/N): " confirm
[[ "$confirm" == "y" ]] || { echo "Aborted"; exit 0; }

# NOW delete
rm -r "$target"
```

---

## Text Processing

| Command | Purpose | Example |
|---------|---------|---------|
| `cat file` | Print file contents | `cat /etc/hostname` |
| `head -20 file` | First 20 lines | `head -20 /var/log/syslog` |
| `tail -50 file` | Last 50 lines | `tail -50 app.log` |
| `tail -f file` | Follow file (live) | `tail -f /var/log/auth.log` |
| `grep "pattern" file` | Find lines matching pattern | `grep ERROR app.log` |
| `grep -E "regex" file` | Extended regex | `grep -E "^\[WARN\]" log.txt` |
| `grep -c "pattern" file` | Count matching lines | `grep -c ERROR app.log` |
| `sort file` | Sort lines | `sort data.txt` |
| `uniq -c file` | Count consecutive duplicates | `uniq -c data.txt` |
| `sort\|uniq -c\|sort -rn` | Count and sort by frequency | `cut -d' ' -f2 access.log\|sort\|uniq -c\|sort -rn` |
| `awk '{print $1, $3}' file` | Extract columns | `awk '{print $1, $3}' data.txt` |
| `cut -d: -f1 /etc/passwd` | Cut by delimiter | `cut -d: -f1 /etc/passwd` |
| `sed 's/old/new/' file` | Replace first match per line | `sed 's/localhost/127.0.0.1/' config.conf` |
| `sed 's/old/new/g' file` | Replace all matches | `sed 's/ERROR/WARN/g' log.txt` |
| `wc -l file` | Count lines | `wc -l /var/log/syslog` |

---

## Redirection & Pipes

| Operator | Purpose | Example |
|----------|---------|---------|
| `> file` | Redirect stdout to file (overwrite) | `ls -la > list.txt` |
| `>> file` | Append stdout to file | `echo "msg" >> log.txt` |
| `2> file` | Redirect stderr to file | `find / -name "foo" 2> errors.log` |
| `2>&1` | Redirect stderr to stdout | `command 2>&1 \| tee output.log` |
| `/dev/null` | Discard output | `command > /dev/null 2>&1` |
| `\|` (pipe) | Pass stdout as stdin to next | `cat log.txt \| grep ERROR` |

**Examples:**
```bash
# Log everything (stdout & stderr)
./script.sh > output.log 2>&1

# Discard all output
./script.sh > /dev/null 2>&1

# Save stdout, show stderr
./script.sh > output.log

# Chain commands
ps aux | grep postgres | grep -v grep | awk '{print $2}'
```

---

## Process Management

| Command | Purpose | Example |
|---------|---------|---------|
| `ps aux` | List all processes with details | `ps aux \| grep postgres` |
| `pgrep -a "pattern"` | Find process by name | `pgrep -a sshd` |
| `kill -15 <PID>` | Graceful shutdown (SIGTERM) | `kill -15 12345` |
| `kill -9 <PID>` | Forceful kill (SIGKILL) | `kill -9 12345` |
| `killall -15 postgres` | Kill by name (SIGTERM) | `killall -15 java` |
| `systemctl status <service>` | Check service status | `systemctl status postgresql` |
| `systemctl restart <service>` | Restart service | `systemctl restart nginx` |
| `systemctl start/stop <service>` | Start/stop service | `systemctl start mysql` |
| `journalctl -u <service>` | View service logs | `journalctl -u postgresql` |
| `journalctl -u <service> -f` | Follow service logs live | `journalctl -u nginx -f` |
| `journalctl --since "2 hours ago"` | Logs from last 2 hours | `journalctl --since "1 hour ago" -p err` |

**Always:** Kill with -15 first, wait a moment, then check. Use -9 only as last resort.

---

## System Health

| Command | Purpose | Example |
|---------|---------|---------|
| `df -h` | Disk space by filesystem | `df -h /var` |
| `du -sh /path` | Total size of directory | `du -sh /var/log` |
| `du -sh /path/*` | Size of each subdir | `du -sh /var/*` |
| `free -h` | Memory usage | `free -h` |
| `uptime` | System uptime and load | `uptime` |
| `ss -tulpn` | Network sockets (TCP/UDP listening) | `ss -tulpn` |
| `ss -tulpn \| grep LISTEN` | Only listening sockets | `ss -tulpn \| grep LISTEN` |
| `ss -tnp` | Active TCP connections | `ss -tnp \| grep ESTABLISHED` |
| `top -b -n 1` | One-shot process snapshot | `top -b -n 1 \| head -20` |

---

## Variables & Quoting

```bash
# Assignment
VAR="value"
VAR=$(command)      # command substitution
VAR=$(<file)        # read file into variable

# ALWAYS quote variables
echo "$VAR"         # GOOD
echo $VAR           # BAD (word splitting)

# Default values
${VAR:-default}     # Use default if VAR unset/empty
${VAR:=default}     # Assign default if unset/empty
${VAR:?error}       # Exit with error if unset/empty
${VAR#prefix}       # Remove prefix
${VAR%suffix}       # Remove suffix

# Length
${#VAR}             # Length of VAR

# Array
ARRAY=("one" "two" "three")
echo "${ARRAY[0]}"  # First element
echo "${ARRAY[@]}"  # All elements
```

---

## Conditionals

```bash
# String comparisons
[[ "$var" == "value" ]]       # Equal
[[ "$var" != "value" ]]       # Not equal
[[ -z "$var" ]]               # Empty string
[[ -n "$var" ]]               # Not empty
[[ "$var" =~ regex ]]         # Regex match

# Integer comparisons
[[ $num -eq 5 ]]              # Equal
[[ $num -ne 5 ]]              # Not equal
[[ $num -lt 5 ]]              # Less than
[[ $num -gt 5 ]]              # Greater than
[[ $num -le 5 ]]              # Less or equal
[[ $num -ge 5 ]]              # Greater or equal

# File tests
[[ -e "$file" ]]              # Exists
[[ -f "$file" ]]              # Regular file
[[ -d "$dir" ]]               # Directory
[[ -r "$file" ]]              # Readable
[[ -w "$file" ]]              # Writable
[[ -x "$file" ]]              # Executable
[[ -s "$file" ]]              # File size > 0

# Logical operators
[[ condition1 ]] && [[ condition2 ]]  # AND
[[ condition1 ]] || [[ condition2 ]]  # OR
[[ ! condition ]]                     # NOT

# Guard pattern (CRITICAL for safety)
[[ -n "$var" ]] || { echo "ERROR: var empty"; exit 1; }
[[ -d "$dir" ]] || { echo "ERROR: dir missing"; exit 1; }
```

---

## Loops

```bash
# For loop — iterate over items
for item in one two three; do
  echo "$item"
done

# For loop — iterate over glob
for logfile in /var/log/*.log; do
  echo "Processing $logfile"
done

# For loop — C-style
for ((i=1; i<=10; i++)); do
  echo "Count: $i"
done

# While loop
while [[ condition ]]; do
  echo "Running..."
  # update condition
done

# While loop — read lines from file
while IFS= read -r line; do
  echo "Line: $line"
done < /path/to/file

# While loop — read command output
ps aux | while IFS= read -r line; do
  echo "$line"
done
```

---

## Functions

```bash
# Define function
my_function() {
  local var="local_scope"      # Local variable
  echo "Arg 1: $1, Arg 2: $2"
  return 0
}

# Call function
my_function "value1" "value2"

# Capture output
result=$(my_function "arg1" "arg2")
echo "$result"

# Check exit status
if my_function; then
  echo "Success"
else
  echo "Failed with code: $?"
fi
```

---

## Error Handling — trap

```bash
# Cleanup on error
trap 'echo "ERROR on line $LINENO"; exit 1' ERR

# Cleanup on any exit
cleanup() {
  echo "Cleaning up..."
  [[ -n "$tmpdir" && -d "$tmpdir" ]] && rm -rf "$tmpdir"
}
trap cleanup EXIT

# Combined
trap 'echo "Error at line $LINENO"; exit 1' ERR
trap 'echo "Exiting..."; cleanup' EXIT
```

---

## Database Quick Reference

| Database | Command | Example |
|----------|---------|---------|
| PostgreSQL | `psql -U user -h host -d dbname` | `psql -U postgres -d mydb` |
| PostgreSQL | `psql -c "SELECT COUNT(*) FROM table;"` | `psql -U postgres -d mydb -c "SELECT * FROM users;"` |
| PostgreSQL | `pg_dump -U user dbname > backup.sql` | `pg_dump -U postgres mydb > /backups/db.sql` |
| PostgreSQL | `psql -U user dbname < backup.sql` | `psql -U postgres mydb < /backups/db.sql` |
| MySQL | `mysql -u user -p -h host dbname` | `mysql -u root -p mydb` |
| MySQL | `mysql -u user -e "SELECT COUNT(*) FROM table;"` | `mysql -u root -e "USE mydb; SELECT * FROM users;"` |
| MySQL | `mysqldump -u user -p dbname > backup.sql` | `mysqldump -u root mydb > /backups/db.sql` |
| MySQL | `mysql -u user -p dbname < backup.sql` | `mysql -u root mydb < /backups/db.sql` |
| Oracle | `sqlplus user/pass@host:port/sid` | `export ORACLE_USER="ops_user" ORACLE_PASS="${ORACLE_PASS:?not set}"; sqlplus -s "${ORACLE_USER}/${ORACLE_PASS}@//host:1521/SID"` |
| Oracle | `sqlplus -S user/pass@sid @script.sql` | `export ORACLE_USER="ops_user"; sqlplus -s "${ORACLE_USER}/${ORACLE_PASS:?ORACLE_PASS not set}@sid" @script.sql` |

**CRITICAL:** `# NEVER write user/pass inline — use env vars or Oracle Wallet`

---

## One-Liners & Patterns

```bash
# Kill process by name safely (use -r to skip if no matches)
pgrep java | xargs -r kill -15

# ALWAYS preview first (run without -delete), then add -delete:
find /var/log -name "*.log" -mtime +30        # step 1: preview
find /var/log -name "*.log" -mtime +30 -delete # step 2: delete

# Monitor disk usage (alert if > 90%)
usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
[[ $usage -gt 90 ]] && echo "DISK CRITICAL: $usage%"

# Restart service and verify
systemctl restart postgresql && sleep 2 && systemctl is-active postgresql || exit 1

# Backup database with timestamp
pg_dump mydb | gzip > /backups/mydb_$(date +%Y%m%d_%H%M%S).sql.gz

# Monitor service logs in real-time
journalctl -u postgresql -f | grep -E "ERROR|CRITICAL"

# Atomic write: use mktemp in same directory as target
tmp=$(mktemp "$(dirname /path/to/final_file.txt)/tmp.XXXXXX")
cat new_data.txt > "$tmp" && mv "$tmp" /path/to/final_file.txt

# Count lines in all logs
find /var/log -name "*.log" -exec wc -l {} + | tail -1
```

---

## Checklists

### Before Every Script
- [ ] `set -euo pipefail` at top
- [ ] All variables quoted: `"$var"`
- [ ] Guard patterns before `rm`, `mv`, destructive commands
- [ ] `shellcheck script.sh` passes
- [ ] Dry-run first: test with `echo` or `--dry-run`
- [ ] Error handling: trap on ERR and EXIT
- [ ] Rollback plan documented

### Before Deploying to Production
- [ ] Script tested in lab environment
- [ ] All credentials removed (use env vars/config)
- [ ] Permissions set correctly (mode, owner)
- [ ] Backup made of original files
- [ ] Kill -15 policy: always try graceful first
- [ ] Monitoring/alerting in place
- [ ] Runbook documented (how to undo)

---

*Generated for bash crashcourse — Nuclear Facility Sysadmin Edition*

# DB Backup Lab: Instructor Notes — Scenario 2

## Lab Overview

This lab teaches defensive bash programming through the lens of database backups. Students write a production-grade backup script that handles the most common failure modes: silent failures, missing credentials, and silent zero-byte file creation. The "zero-byte trap" is real and has cost companies hours of debugging.

**Timing**: 55 minutes total
- 5 min: Introduction and argument parsing
- 12 min: Core backup loop implementation
- 18 min: Zero-byte failure demo
- 15 min: Testing and shellcheck
- 5 min: Cron scheduling discussion

## Key Teaching Moments

### 1. The Zero-Byte Trap Demo (Critical)

**Why this matters**: pg_dump and mysqldump silently fail in certain conditions (connection refused, auth failures, disk full). They produce a zero-byte file. Without a verification step, nobody notices until the recovery fails at the worst possible time.

**Demonstration**:
```bash
# Show what happens without verification
pg_dump nonexistent_db > /tmp/bad_backup.sql 2>/dev/null
ls -lh /tmp/bad_backup.sql
# Output: -rw-r--r-- 0 user staff 0B Apr 9 14:23 /tmp/bad_backup.sql

# Show the fix
[[ -s /tmp/bad_backup.sql ]] && echo "Good" || echo "Backup empty - FAIL"
# Output: Backup empty - FAIL
```

**Key point**: The `-s` test is the safety net between a backup and a disaster. It's worth 10 minutes of class time because students will use this pattern for years.

### 2. $PGPASSWORD is Magic (Non-obvious)

**What students don't know**: When `$PGPASSWORD` is set in the environment, `pg_dump` automatically reads it and uses it for authentication. No explicit flag needed. This is a feature, not a bug.

**Why teach it**:
- It's the secure way to pass passwords (no command-line visibility with `ps`)
- It's the postgres convention; mysql requires `-p"$MYSQL_PASS"`
- This difference is a teachable moment about tool-specific conventions

**Demo**:
```bash
export PGPASSWORD=secret
pg_dump -U postgres mydb > backup.sql  # PGPASSWORD is used automatically
unset PGPASSWORD
```

**Common mistake**: Students try `pg_dump --password="$PGPASSWORD"` — this doesn't work with pg_dump.

### 3. find -mtime +7 -delete vs Manual rm Loops (Safety)

**Why this matters**: Manual `for` loops with `rm` are error-prone.

```bash
# DANGEROUS - easy to delete the wrong files
for file in /tmp/backups/backup_*.sql; do
  if [[ $(stat -f%z "$file") -lt 1000 ]]; then  # wrong size check
    rm "$file"  # oops, deletes current backups too
  fi
done

# SAFE - uses mtime, doesn't mix size checks with deletion
find /tmp/backups -name "backup_${db_name}_*" -mtime +7 -delete
```

**Teaching point**: `find` with `-mtime` is the standard unix tool for this job. It's safer, faster, and more readable.

### 4. case for Dispatch (Pattern Recognition)

Students often write:
```bash
if [[ "$db_type" == "postgres" ]]; then
  # ...
elif [[ "$db_type" == "mysql" ]]; then
  # ...
fi
```

**Better pattern**:
```bash
case "$db_type" in
  postgres)
    # ...
    ;;
  mysql)
    # ...
    ;;
  *)
    die "Unknown type"
    ;;
esac
```

**Why**: It's more readable, faster to add types, and the `*)` catchall is explicit. This is a major code clarity win.

### 5. mkdir -p is Idempotent (Reliability)

**What to emphasize**: `mkdir -p` doesn't fail if the directory already exists. It's safe to call every time. This is why scripts use it in every backup run, not just on first setup.

```bash
mkdir -p /tmp/backups  # Creates if missing, succeeds if exists
```

**Why this matters**: Distributed systems, multiple cron jobs, and restarts all benefit from idempotent commands. It's a resilience pattern.

## Common Student Mistakes

### Mistake 1: Capturing pg_dump Output Instead of Redirecting

**Student code**:
```bash
output=$(pg_dump "$db_name")
echo "$output" > "$backup_file"  # WRONG - passes through shell, loses newlines, large files can overflow memory
```

**Correct**:
```bash
pg_dump "$db_name" > "$backup_file"  # RIGHT - direct file descriptor, efficient, preserves format
```

**Why**: Large databases (multiple GB) will overflow memory if captured in a variable. The shell loses newlines. Direct redirection is the only safe approach.

**Fix**: Show the difference with `strace` (if advanced) or just with a 100MB test file.

### Mistake 2: Hardcoding Passwords "Just for Testing"

**Student code**:
```bash
POSTGRES_PASSWORD="secret123"
pg_dump -U postgres "$db_name" > backup.sql  # WRONG - password in plaintext in script
```

**Correct**:
```bash
[[ -n "${PGPASSWORD:-}" ]] || die "PGPASSWORD not set"
pg_dump -U postgres "$db_name" > backup.sql  # RIGHT - uses environment variable
```

**Why**: Even "test" passwords left in code get committed, then someone clones the repo, the password spreads. Use environment variables always.

**Fix**: Show them how to set env vars safely:
```bash
export PGPASSWORD=test_password
./db_backup.sh --db-type postgres --db-name testdb
```

### Mistake 3: Forgetting to Check $PGPASSWORD is Set

**Student code**:
```bash
pg_dump -U postgres "$db_name" > backup.sql
# If PGPASSWORD is missing, pg_dump will try to read from terminal or fail silently
```

**Correct**:
```bash
[[ -n "${PGPASSWORD:-}" ]] || die "PGPASSWORD environment variable is not set"
pg_dump -U postgres "$db_name" > backup.sql
```

**Why**: Failing early with a clear error message is better than a confusing "connection failed" later. This is the fail-fast principle.

### Mistake 4: Using ls|wc -l Instead of find|wc -l for Rotation

**Student code**:
```bash
# WRONG - fragile, race conditions, doesn't scale
backup_count=$(ls /tmp/backups/backup_* 2>/dev/null | wc -l)
if [[ $backup_count -gt 10 ]]; then
  rm /tmp/backups/backup_$(ls -t /tmp/backups | head -1)  # fragile
fi
```

**Correct**:
```bash
# RIGHT - uses mtime, atomic, reliable
find /tmp/backups -name "backup_${db_name}_*" -mtime +7 -delete
```

**Why**: `ls` output is unpredictable, can have race conditions, and doesn't work with many files. `find -mtime` is the unix standard.

## Expected Student Output

When students run their completed script:

```
$ PGPASSWORD=secret ./db_backup.sh --db-type postgres --db-name myapp_prod
[2026-04-09 14:23:45] Starting backup of myapp_prod (postgres)
[2026-04-09 14:23:46] Backup file: /tmp/backups/backup_myapp_prod_20260409_142345.sql
[2026-04-09 14:23:46] Backup size: 2547 bytes ✓
[2026-04-09 14:23:46] Rotated backups older than 7 days
[2026-04-09 14:23:46] Backup completed successfully
```

Log file should show:
```
$ tail -5 /tmp/db_backup.log
[2026-04-09 14:23:45] Starting backup of myapp_prod (postgres)
[2026-04-09 14:23:46] Backup file: /tmp/backups/backup_myapp_prod_20260409_142345.sql
[2026-04-09 14:23:46] Backup size: 2547 bytes ✓
[2026-04-09 14:23:46] Rotated backups older than 7 days
[2026-04-09 14:23:46] Backup completed successfully
```

## Testing Strategy

### Test 1: Argument Parsing (5 min)
```bash
# Should fail with clear message
./db_backup.sh
# Should fail with clear message
./db_backup.sh --db-type postgres
# Should succeed (with mocked pg_dump)
./db_backup.sh --db-type postgres --db-name testdb
```

### Test 2: Zero-Byte Detection (10 min)
```bash
# Create a mock pg_dump that produces empty output
pg_dump() { touch "$@"; }  # Override with empty output
export PGPASSWORD=test
./db_backup.sh --db-type postgres --db-name testdb  # Should FAIL
# Output should be: ERROR: Backup file is empty or missing
```

### Test 3: Mock Database Testing (without real DB)
```bash
# Override pg_dump in a test script
test_postgres_backup() {
  pg_dump() {
    echo "mock backup data" > "$@"
  }
  export pg_dump  # Make it available to subshells if needed
  export PGPASSWORD=test
  ./db_backup.sh --db-type postgres --db-name testdb
}
```

### Test 4: Log File Verification
```bash
# Check that each run adds timestamped entries
./db_backup.sh --db-type postgres --db-name testdb &
./db_backup.sh --db-type postgres --db-name testdb &
wait
grep "Starting backup" /tmp/db_backup.log  # Should show 2 entries
```

### Test 5: Shellcheck (2 min)
```bash
shellcheck db_backup.sh  # Must be zero warnings
```

## Discussion: Production Considerations

After the lab, discuss:

1. **Cron scheduling**: How to schedule this job
   ```bash
   # Every day at 2 AM
   0 2 * * * /path/to/db_backup.sh --db-type postgres --db-name mydb
   ```

2. **Remote backups**: Store backups off-site
   ```bash
   # Add to the script:
   scp "$backup_file" backup-server:/mnt/backups/
   ```

3. **Email notifications**: Alert on failure
   ```bash
   # If run_backup fails, script exits non-zero, cron emails the error
   ```

4. **Monitoring**: Check if backups are actually happening
   ```bash
   find /tmp/backups -name "backup_*" -mtime 0  # Should find today's backup
   ```

## Debugging Tips for Instructors

**Students say "it says command not found"**
- They're testing without a real database or real pg_dump installed
- Use the mock function approach to test without infrastructure

**Students say "Permission denied"**
- Check that db_backup.sh has execute permission: `chmod +x db_backup.sh`
- Check that /tmp/backups is writable

**Students say "Backup size shows 0"**
- The zero-byte trap occurred! This is the lesson. Walk them through the verification step.

**Shellcheck reports SC2155**
- Tell them: "Never declare and assign in the same line for local variables. Separate them so you can catch errors."
- Show the fix:
  ```bash
  # WRONG
  local timestamp="$(date '+%Y-%m-%d')"
  
  # RIGHT
  local timestamp
  timestamp=$(date '+%Y-%m-%d')
  ```

## Extension Activities

For advanced students:

1. **Parallel backups**: Use `&` and `wait` to backup multiple databases at once
2. **Compression**: Add `| gzip` to compress the output
3. **Checksum verification**: Store `md5sum` in a sidecar file and verify on restore
4. **Monitoring integration**: Add metrics output (size, duration) to a monitoring system
5. **Database-specific optimizations**: For MySQL, add `--single-transaction` for InnoDB consistency

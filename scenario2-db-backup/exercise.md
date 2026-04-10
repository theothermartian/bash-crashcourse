# DB Backup Lab: Scenario 2

## Mission Brief

A developer once wrote a backup script that produced a zero-byte file because pg_dump silently failed. Nobody noticed for three weeks. You've been hired to write the backup script that ops will actually trust.

## Requirements

Your script must:

1. **Accept arguments** via `--db-type` and `--db-name` flags
   - `--db-type`: either `postgres` or `mysql`
   - `--db-name`: the name of the database to backup

2. **Create timestamped backups** at `/tmp/backups/backup_DBNAME_YYYYMMDD_HHMMSS.sql`
   - Use `$(date +%Y%m%d_%H%M%S)` for the timestamp

3. **Read credentials from environment variables**
   - **Postgres**: `$PGPASSWORD` (pg_dump reads this automatically)
   - **MySQL**: `$MYSQL_PASS` (pass with `-p"${MYSQL_PASS}"`)
   - **Never hardcode passwords** — not even "just for testing"

4. **Verify backups are non-zero** with `[[ -s "$file" ]]`
   - This catches the zero-byte trap before it ruins your week

5. **Rotate backups older than 7 days** using `find -mtime +7 -delete`
   - Run this in the backup directory every time

6. **Log every step with timestamps**
   - Create a log function that writes to `/tmp/db_backup.log`
   - Include timestamps in every log line
   - Log the backup file path, size, and rotation results

7. **Exit non-zero on any failure**
   - Use `set -euo pipefail` at the top
   - Create a `die()` function that writes errors to stderr and exits with code 1

## Argument Parsing Pattern

Use this structure:

```bash
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --db-type)
        db_type="$2"
        shift 2
        ;;
      --db-name)
        db_name="$2"
        shift 2
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
  
  # Validate both are set
  [[ -n "$db_type" ]] || die "--db-type is required"
  [[ -n "$db_name" ]] || die "--db-name is required"
}
```

## Testing Without a Real Database

You can mock pg_dump/mysqldump for testing:

```bash
# In your test shell, override pg_dump with a function:
pg_dump() {
  echo "Mock backup data" > "$@"
}

# Now your script will succeed without a real database
./db_backup.sh --db-type postgres --db-name testdb
```

Or create a test wrapper script that redefines the commands before running your backup script.

## Expected Output Example

```
$ PGPASSWORD=secret ./db_backup.sh --db-type postgres --db-name myapp_prod

[2026-04-09 14:23:45] Starting backup of myapp_prod (postgres)
[2026-04-09 14:23:46] Backup file: /tmp/backups/backup_myapp_prod_20260409_142345.sql
[2026-04-09 14:23:46] Backup size: 2547 bytes ✓
[2026-04-09 14:23:46] Rotated backups older than 7 days
[2026-04-09 14:23:46] Backup completed successfully
```

## Deliverables

- A script named `db_backup.sh` that implements all requirements above
- The script must pass `shellcheck` with zero warnings
- The script must be executable: `chmod +x db_backup.sh`

## Testing Checklist

- [ ] `./db_backup.sh --db-type postgres --db-name testdb` succeeds with mocked pg_dump
- [ ] `./db_backup.sh --db-type mysql --db-name testdb` succeeds with mocked mysqldump
- [ ] `./db_backup.sh` (no args) exits non-zero with error message
- [ ] Backup file is created in the correct location with correct name format
- [ ] Log file contains timestamped entries for each backup
- [ ] Old backups are rotated away after 7 days
- [ ] Zero-byte files are rejected (test by making pg_dump produce empty output)
- [ ] shellcheck reports zero warnings

## Hints

- Use `mkdir -p` to create the backup directory (it's idempotent)
- The `find -mtime +7 -delete` command is safer than manual `rm` loops
- Test the argument parsing separately before adding database logic
- Remember: `pg_dump` and `mysqldump` write to stdout unless you redirect with `>`

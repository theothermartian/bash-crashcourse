#!/bin/bash
set -euo pipefail

# Database backup script with error handling and rotation
# Supports postgres and mysql databases with credential management

BACKUP_DIR="/tmp/backups"
LOG_FILE="/tmp/db_backup.log"

# Initialize variables
db_type=""
db_name=""
backup_file=""
timestamp=""

# Log function: writes timestamped messages to log file
log() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local log_entry="[$timestamp] $message"
  echo "$log_entry" >> "$LOG_FILE"
  echo "$log_entry"
}

# Die function: writes error to stderr and exits with code 1
die() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] ERROR: $message" >&2
  exit 1
}

# Parse command-line arguments
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

  # Validate both arguments are set
  [[ -n "$db_type" ]] || die "--db-type is required"
  [[ -n "$db_name" ]] || die "--db-name is required"

  # Validate db_name contains only safe characters (prevent path traversal)
  [[ "$db_name" =~ ^[a-zA-Z0-9_-]+$ ]] || die "Invalid database name: only alphanumeric, underscore, and hyphen allowed"

  # Validate db_type is one of the supported options
  case "$db_type" in
    postgres|mysql)
      :
      ;;
    *)
      die "Invalid --db-type: $db_type (must be 'postgres' or 'mysql')"
      ;;
  esac
}

# Run the backup for the specified database
run_backup() {
  log "Starting backup of $db_name ($db_type)"

  # Create backup directory
  mkdir -p "$BACKUP_DIR" || die "Failed to create backup directory: $BACKUP_DIR"

  # Generate timestamped filename
  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_file="$BACKUP_DIR/backup_${db_name}_${timestamp}.sql"

  # Perform backup based on database type
  case "$db_type" in
    postgres)
      # Verify PGPASSWORD is set and not entirely whitespace
      [[ -n "${PGPASSWORD:-}" ]] || die "PGPASSWORD environment variable is not set"
      [[ -n "${PGPASSWORD// /}" ]] || die "PGPASSWORD environment variable must not be blank"

      # Run pg_dump and redirect to backup file
      pg_dump -U postgres "$db_name" > "$backup_file" || die "pg_dump failed for database: $db_name"
      ;;
    mysql)
      # Verify MYSQL_PASS is set
      [[ -n "${MYSQL_PASS:-}" ]] || die "MYSQL_PASS environment variable is not set"

      # Write password to a temporary defaults file to avoid exposing it in the process list
      local defaults_file
      defaults_file=$(mktemp)
      chmod 600 "$defaults_file"
      printf '[client]\npassword=%s\n' "${MYSQL_PASS}" > "$defaults_file"

      # Run mysqldump using the defaults file and clean up the temp file afterwards
      mysqldump --defaults-extra-file="$defaults_file" -u root "$db_name" > "$backup_file"
      local exit_code=$?
      rm -f "$defaults_file"
      [[ $exit_code -eq 0 ]] || die "mysqldump failed for database: $db_name"
      ;;
    *)
      die "Unknown database type: $db_type"
      ;;
  esac

  # Verify backup file is non-zero
  [[ -s "$backup_file" ]] || die "Backup file is empty or missing: $backup_file"

  # Log backup file details
  local backup_size
  backup_size=$(stat -c%s "$backup_file")
  log "Backup file: $backup_file"
  log "Backup size: ${backup_size} bytes"

  # Rotate backups older than 7 days
  if find "$BACKUP_DIR" -name "backup_${db_name}_*" -mtime +7 -delete 2>/dev/null; then
    log "Rotated backups older than 7 days"
  fi

  log "Backup completed successfully"
}

# Main execution
parse_args "$@"
run_backup

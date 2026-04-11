#!/bin/bash
# Sets up the student home directory and course files inside the Alpine container

set -euo pipefail

HOME_DIR=/home/student

# --- Sample log file for text processing exercises ---
mkdir -p "$HOME_DIR/logs"
cat > "$HOME_DIR/logs/app.log" << 'EOF'
2026-04-10 08:01:02 [INFO]  Service started successfully
2026-04-10 08:01:05 [INFO]  Connected to database
2026-04-10 08:03:11 [WARN]  High memory usage detected: 87%
2026-04-10 08:05:33 [ERROR] Failed to write backup: disk full
2026-04-10 08:05:34 [ERROR] Retry attempt 1 of 3
2026-04-10 08:05:36 [ERROR] Retry attempt 2 of 3
2026-04-10 08:06:01 [INFO]  Disk space cleared by operator
2026-04-10 08:06:02 [INFO]  Backup completed successfully
2026-04-10 08:10:00 [INFO]  Health check passed
2026-04-10 08:15:00 [WARN]  Slow query detected: 4.2s
2026-04-10 08:20:00 [ERROR] Connection timeout to replica
2026-04-10 08:20:01 [INFO]  Failover initiated
2026-04-10 08:20:05 [INFO]  Failover completed
2026-04-10 08:25:00 [INFO]  Health check passed
2026-04-10 08:30:00 [INFO]  Health check passed
EOF

# --- Sample data files for awk/cut exercises ---
mkdir -p "$HOME_DIR/data"
cat > "$HOME_DIR/data/users.csv" << 'EOF'
username,uid,role,status
alice,1001,admin,active
bob,1002,operator,active
charlie,1003,viewer,inactive
diana,1004,admin,active
eve,1005,operator,inactive
EOF

cat > "$HOME_DIR/data/processes.txt" << 'EOF'
nginx     1234  0.1  512
postgres  5678  2.3  2048
sshd      9012  0.0  128
backup    3456  15.2 4096
monitor   7890  0.5  256
EOF

# --- Sample scripts for shellcheck/scripting exercises ---
mkdir -p "$HOME_DIR/scripts"
cat > "$HOME_DIR/scripts/backup.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail
BACKUP_DIR=/tmp/backups
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Backup started at $TIMESTAMP" >> "$BACKUP_DIR/backup.log"
echo "Simulating backup..."
sleep 0
echo "Backup complete" >> "$BACKUP_DIR/backup.log"
SCRIPT
chmod +x "$HOME_DIR/scripts/backup.sh"

cat > "$HOME_DIR/scripts/broken.sh" << 'SCRIPT'
#!/bin/bash
dir = "/tmp/test"
rm -rf $dir/*
echo Hello $USER
SCRIPT

# --- Directories for redirection/file exercises ---
mkdir -p "$HOME_DIR/work"
mkdir -p /tmp/backups

# --- Fix ownership ---
chown -R student:student "$HOME_DIR"

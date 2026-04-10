#!/bin/bash
set -euo pipefail

# setup_labs.sh — Run as root on vm1 before students arrive
# Creates all pre-staged directories and files for Labs 2–8

echo "Setting up crashcourse lab environment..."

# ---------------------------------------------------------------------------
# Lab 2 — Navigation & File Operations
# ---------------------------------------------------------------------------
mkdir -p /opt/crashcourse/lab2/{configs,logs,scripts,data}

cat > /opt/crashcourse/lab2/configs/database.conf << 'EOF'
# PostgreSQL configuration
host=localhost
port=5432
database=reactor_ops
user=ops_user
EOF
chmod 644 /opt/crashcourse/lab2/configs/database.conf

cat > /opt/crashcourse/lab2/scripts/broken_monitor.sh << 'EOF'
#!/bin/bash
set -euo pipefail

logdir=/var/log
echo "Checking logs in: $logdir"
find $logdir -name "*.log" -mtime -1
EOF
# Intentionally not executable — students must fix with chmod
chmod 644 /opt/crashcourse/lab2/scripts/broken_monitor.sh

# Pad log file to over 1KB
for i in $(seq 1 60); do
  echo "Apr 09 08:0${i:0:1}:01 reactor-vm1 systemd[1]: Session $i log entry padding line" \
    >> /opt/crashcourse/lab2/logs/system-2026-04-09.log
done

# ---------------------------------------------------------------------------
# Lab 3 — Text Processing
# ---------------------------------------------------------------------------
mkdir -p /opt/crashcourse/lab3
# generate_log.sh must be placed at this path before running setup_labs.sh
bash /opt/crashcourse/lab3/generate_log.sh 2>/dev/null || true

# ---------------------------------------------------------------------------
# Lab 4 — Process & System Management
# ---------------------------------------------------------------------------
mkdir -p /opt/crashcourse/lab4

cat > /opt/crashcourse/lab4/monitor_loop.sh << 'EOF'
#!/bin/bash
set -euo pipefail
while true; do
  echo "$(date '+%Y-%m-%d %H:%M:%S') crashcourse-monitor: heartbeat OK"
  sleep 30
done
EOF
chmod +x /opt/crashcourse/lab4/monitor_loop.sh

cat > /etc/systemd/system/crashcourse-monitor.service << 'EOF'
[Unit]
Description=Crashcourse Lab Monitor Service
After=network.target

[Service]
Type=simple
User=student
ExecStart=/opt/crashcourse/lab4/monitor_loop.sh
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable crashcourse-monitor
systemctl start crashcourse-monitor

# ---------------------------------------------------------------------------
# Lab 5 — Users, Permissions & Packages
# ---------------------------------------------------------------------------
mkdir -p /opt/crashcourse/lab5

cat > /opt/crashcourse/lab5/database.conf << 'EOF'
# Database connection configuration
host=10.0.0.100
port=5432
database=reactor_ops
user=ops_reader
password=CHANGEME_IN_PRODUCTION
EOF
# Intentionally too permissive — students must fix this in the lab
chmod 644 /opt/crashcourse/lab5/database.conf

# ---------------------------------------------------------------------------
# Log directory for Labs 7 and 8
# ---------------------------------------------------------------------------
mkdir -p /var/log/crashcourse
chown student:student /var/log/crashcourse
chmod 750 /var/log/crashcourse

# ---------------------------------------------------------------------------
# Verify setup
# ---------------------------------------------------------------------------
echo ""
echo "Lab setup complete."
echo ""
echo "Verification:"
systemctl status crashcourse-monitor --no-pager
echo ""
echo "Pre-session checklist:"
echo "  [ ] shellcheck --version"
echo "  [ ] psql --version"
echo "  [ ] systemctl is-active postgresql"
echo "  [ ] ssh student@<vm2-ip> hostname"
echo "  [ ] wc -l /opt/crashcourse/lab3/sample.log   (should be ~500)"

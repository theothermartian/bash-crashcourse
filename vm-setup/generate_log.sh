#!/bin/bash
set -euo pipefail

# generate_log.sh — generates /opt/crashcourse/lab3/sample.log (~500 lines)
# Run as root before students arrive: sudo bash /opt/crashcourse/lab3/generate_log.sh
# Then verify: wc -l /opt/crashcourse/lab3/sample.log
#              grep -c "ERROR" /opt/crashcourse/lab3/sample.log

outfile="/opt/crashcourse/lab3/sample.log"
mkdir -p "$(dirname "$outfile")"

levels=("INFO" "INFO" "INFO" "WARN" "ERROR" "CRITICAL" "DEBUG")
services=("db-service" "auth-service" "reactor-monitor" "backup-agent" "api-gateway")
ips=("192.168.1.10" "192.168.1.20" "192.168.1.55" "10.0.0.5" "10.0.0.12")
messages=(
  "Connection established"
  "Connection timeout"
  "Service started"
  "Health check passed"
  "Authentication failed from"
  "Disk usage at 85 percent"
  "Backup completed successfully"
  "Query executed in 2.3s"
)

> "$outfile"

for i in $(seq 1 500); do
  ts=$(date -d "2026-04-09 08:00:00 + $i minutes" '+%Y-%m-%d %H:%M:%S' 2>/dev/null \
       || date -v "+${i}M" -j -f "%Y-%m-%d %H:%M:%S" "2026-04-09 08:00:00" '+%Y-%m-%d %H:%M:%S')
  level="${levels[$((RANDOM % ${#levels[@]}))]}"
  service="${services[$((RANDOM % ${#services[@]}))]}"
  msg="${messages[$((RANDOM % ${#messages[@]}))]}"
  ip="${ips[$((RANDOM % ${#ips[@]}))]}"
  echo "$ts $level $service $msg $ip" >> "$outfile"
done

echo "Generated $outfile with $(wc -l < "$outfile") lines"

#!/bin/bash
set -euo pipefail

LOG="/tmp/health_check.log"
WARN=0
FAIL=0

# Initialize log file
: > "$LOG"

log() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] ${message}" | tee -a "$LOG"
}

check_cpu() {
  log "Checking CPU Load..."
  local load_avg
  load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')

  if (( $(echo "$load_avg > 2.0" | bc -l) )); then
    log "  CPU Load (1min): ${load_avg} — WARN"
    WARN=1
  else
    log "  CPU Load (1min): ${load_avg} — OK"
  fi
}

check_disk() {
  log "Checking Disk Usage..."
  local disk_usage
  disk_usage=$(df / | awk 'NR==2 {print $5}' | tr -d '%')

  if (( disk_usage > 80 )); then
    log "  Disk / : ${disk_usage}% — WARN"
    WARN=1
  else
    log "  Disk / : ${disk_usage}% — OK"
  fi
}

check_memory() {
  log "Checking Memory Usage..."
  local total
  local used
  local mem_percent

  total=$(free | awk '/^Mem:/ {print $2}')
  used=$(free | awk '/^Mem:/ {print $3}')
  mem_percent=$(awk "BEGIN {printf \"%.0f\", ($used/$total)*100}")

  if (( mem_percent > 90 )); then
    log "  Memory: ${mem_percent}% — WARN"
    WARN=1
  else
    log "  Memory: ${mem_percent}% — OK"
  fi
}

check_service() {
  local service="$1"
  log "Checking Service ${service}..."

  if systemctl is-active --quiet "$service" 2>/dev/null; then
    log "  Service ${service}: OK"
  else
    log "  Service ${service}: FAIL"
    FAIL=1
  fi
}

check_network() {
  log "Checking Network (ping 8.8.8.8)..."

  if ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; then
    log "  Network (ping 8.8.8.8): OK"
  else
    log "  Network (ping 8.8.8.8): WARN"
    WARN=1
  fi
}

main() {
  log "===================================="
  log "Health Check Started"
  log "===================================="

  check_cpu
  check_disk
  check_memory

  # Check critical services
  check_service "ssh"
  check_service "cron"
  check_service "postgresql"

  check_network

  log "===================================="

  if (( FAIL > 0 )); then
    log "Final Status: FAIL"
    log "===================================="
    exit 1
  elif (( WARN > 0 )); then
    log "Final Status: WARN"
    log "===================================="
    exit 1
  else
    log "Final Status: PASS"
    log "===================================="
    exit 0
  fi
}

main "$@"

#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Script: <name>.sh
# Purpose: <one line description>
# Usage: ./<name>.sh [args]
# ---------------------------------------------------------------------------

# Set LOG_FILE before running, or override: LOG_FILE=/var/log/myscript.log ./script.sh
# The /tmp default is for development only — use a persistent path in production.
LOG_FILE="${LOG_FILE:-/tmp/script.log}"

# --- Functions ---

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

# --- Guards ---

# ADAPT THIS guard to match your script's actual argument requirements.
[[ $# -ge 1 ]] || die "Usage: $0 <arg>"

# --- Main ---

main() {
  log "Starting $0"
  # TODO: implement
  log "Done"
}

main "$@"

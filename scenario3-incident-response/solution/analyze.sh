#!/bin/bash
# Reference solution — instructor reference, not for students

set -euo pipefail

LOG="$HOME/labs/shared/incident.log"

# Verify log file exists
if [[ ! -f "$LOG" ]]; then
  echo "Error: Log file not found at $LOG" >&2
  exit 1
fi

echo "=== Task A: Severity Breakdown ==="
for severity in ERROR FATAL CRITICAL; do
  count=$(grep -c "$severity" "$LOG" || true)
  echo "$count $severity"
done

echo ""
echo "=== Task B: Error Time Window ==="
echo "First error:"
grep -E "ERROR|FATAL|CRITICAL" "$LOG" | head -1 | awk '{print $1, $2}'

echo "Last error:"
grep -E "ERROR|FATAL|CRITICAL" "$LOG" | tail -1 | awk '{print $1, $2}'

echo ""
echo "=== Task C: Failed Password Attempts by IP ==="
grep "Failed password" "$LOG" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c | sort -rn

echo ""
echo "=== Task D: Top Postgres Errors (Top 10) ==="
grep "postgres" "$LOG" | grep -E "ERROR|FATAL" | awk -F'] ' '{print $NF}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== Task E: Incident Report ==="
echo "See ~/incident_report.txt for the full incident report."

# Scenario 1: Health Check — Lab Exercise

## Mission Brief

You're on-call. A customer is reporting potential issues with their Ubuntu server, but you need to act fast. Write a bash script that tells you in 3 seconds whether this server is healthy or needs attention. Your script must check critical systems and log everything for your incident report.

## Requirements

Your `health_check.sh` script must:

1. **CPU Load Check**: Extract the 1-minute load average and warn if it exceeds 2.0
2. **Disk Usage Check**: Warn if any partition (especially root `/`) has usage > 80%
3. **Memory Check**: Warn if used memory exceeds 90% of total
4. **Service Checks**: Verify these 3 critical services are active:
   - `ssh` (remote access)
   - `cron` (scheduled tasks)
   - `postgresql` (database)
5. **Network Check**: Ping `8.8.8.8` with a 2-second timeout to verify outbound connectivity
6. **Logging**: Write all results with timestamps to `/tmp/health_check.log`
7. **Summary Output**: Print a final status: `PASS`, `WARN`, or `FAIL`
8. **Exit Code**: Exit with code 0 on PASS, non-zero on WARN or FAIL

## Rules

- Start from the provided script template (`#!/bin/bash` and `set -euo pipefail`)
- Run `shellcheck` on your finished script — **zero warnings allowed**
- All variable expansions must be quoted (e.g., `"$var"` not `$var`)
- Perform read-only checks only (no system changes)
- Use timestamp format in logs: `[YYYY-MM-DD HH:MM:SS]`

## Helpful Hints

### Getting the 1-minute load average with awk
```bash
uptime | awk -F'load average:' '{print $2}' | awk '{print $1}'
```

### Getting disk usage percentage with df and awk
```bash
df / | awk 'NR==2 {print $5}' | tr -d '%'
```

### Getting memory usage percentage with free and awk
```bash
free | awk '/^Mem:/ {printf "%.0f", ($3/$2)*100}'
```

### Checking if a service is active with systemctl
```bash
systemctl is-active --quiet ssh && echo "OK" || echo "DOWN"
```
Note: Use `--quiet` to suppress output and only check exit status.

### Float comparison with bc
```bash
if (( $(echo "$load > 2.0" | bc -l) )); then
  echo "CPU load is too high"
fi
```
Remember: Use `bc -l` (with `-l` flag) for floating-point arithmetic.

### Ping with timeout
```bash
ping -c1 -W2 8.8.8.8
```
Flags: `-c1` = send 1 packet, `-W2` = 2-second timeout.

## Testing Instructions

1. Make the script executable:
   ```bash
   chmod +x health_check.sh
   ```

2. Run shellcheck:
   ```bash
   shellcheck health_check.sh
   ```
   This should produce **zero warnings**.

3. Run the script:
   ```bash
   ./health_check.sh
   ```

4. Check the exit code:
   ```bash
   echo $?
   ```
   Should be 0 for PASS, non-zero for WARN/FAIL.

5. Review the log:
   ```bash
   cat /tmp/health_check.log
   ```

## Expected Output Example

When the system is healthy, you might see:
```
[2026-04-09 14:23:15] CPU Load (1min): 1.2 — OK
[2026-04-09 14:23:15] Disk / : 45% — OK
[2026-04-09 14:23:15] Memory: 72% — OK
[2026-04-09 14:23:15] Service ssh: OK
[2026-04-09 14:23:15] Service cron: OK
[2026-04-09 14:23:15] Service postgresql: OK
[2026-04-09 14:23:15] Network (ping 8.8.8.8): OK
[2026-04-09 14:23:15] ================================
[2026-04-09 14:23:15] Final Status: PASS
[2026-04-09 14:23:15] ================================
```

Exit code: 0

When there are warnings:
```
[2026-04-09 14:23:15] CPU Load (1min): 2.5 — WARN
[2026-04-09 14:23:15] Service postgresql: FAIL
[2026-04-09 14:23:15] Final Status: WARN (1 issue found)
```

Exit code: 1

---

**Time to complete**: 10-15 minutes for the core script, plus 10 more if you want to add extra features (e.g., checking additional services, testing on other partitions).

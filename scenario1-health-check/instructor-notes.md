# Scenario 1: Health Check — Instructor Notes

## Lab Overview

This is a practical, real-world exercise that teaches shell scripting fundamentals in a DevOps context. Students write a health monitoring script that exercises:
- Command pipelines and text processing (awk, bc)
- Conditional logic and floating-point comparisons
- System administration tools (systemctl, df, free, uptime)
- Error handling and exit codes
- Logging and debugging practices

**Expected duration:** 40 minutes total (5 min brief, 10 min core work, 15 min walkthrough, 10 min extension/discussion)

---

## Key Teaching Moments

### 1. Floating-Point Arithmetic with `bc -l`

Students often try to do floating-point comparisons with `(( ... ))`, which only works with integers. This is the moment to teach `bc`.

**What students will try:**
```bash
if (( $load > 2.0 )); then  # WRONG: 2.0 is invalid in (( ))
```

**Why it's important:**
- Load averages are always floats (e.g., 2.35, 0.89)
- Integer-only arithmetic silently truncates or errors
- `bc -l` (with `-l` flag for math library) is the standard POSIX way

**Teaching point:** Show the difference:
```bash
# This works:
if (( $(echo "2.5 > 2.0" | bc -l) )); then echo "HIGH"; fi

# This fails silently or errors:
if (( 2.5 > 2.0 )); then echo "HIGH"; fi  # Syntax error
```

---

### 2. Using `systemctl is-active --quiet` vs. Parsing Status Output

Students might parse the full `systemctl status` output, which is fragile.

**What students might try:**
```bash
systemctl status ssh | grep -q "active (running)"  # Fragile, locale-dependent
```

**Why `--quiet` is better:**
- Only checks exit code (clean, efficient)
- No parsing required
- Doesn't depend on system language/locale
- Standard approach in production scripts

**Teaching point:** The `--quiet` flag is a pattern:
```bash
# Idiomatic:
if systemctl is-active --quiet ssh; then
  # SSH is running
fi
```

Mention: Add `2>/dev/null` to suppress error messages if a service doesn't exist, making the script more robust.

---

### 3. Using `|| true` for Optional Services

If a service might not exist on the system (e.g., postgresql isn't always running), use `|| true`:

```bash
systemctl is-active --quiet postgresql 2>/dev/null || true
```

This prevents the script from exiting unexpectedly if a service is not found.

---

### 4. Logging Before Exit, Not After

Students often write:
```bash
log "Final Status: FAIL"
exit 1
log "More info"  # This never runs!
```

**Teaching point:** Make it clear:
- `exit` terminates the script immediately
- All logging must happen **before** `exit`
- Use a separator (dashes) to mark the end of output before exiting

---

### 5. WARN vs. FAIL Distinction

Clarify the philosophy:
- **WARN** = Minor issues (high CPU, high memory, network latency) — system still mostly functional
- **FAIL** = Critical issues (service down, disk full) — system is degraded or broken
- Exit code: Both WARN and FAIL exit non-zero, but the log shows the difference

In this lab:
- CPU, disk, memory → WARN
- Services not running → FAIL
- Network unreachable → WARN

---

## Common Student Mistakes

### Mistake 1: Forgetting `local` in Functions

```bash
check_cpu() {
  load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')
  # If load_avg already exists globally, this overwrites it!
}
```

**Fix:** Always use `local`:
```bash
check_cpu() {
  local load_avg
  load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')
}
```

---

### Mistake 2: Using `$()` for Arithmetic

```bash
if (( $(echo "1 + 1") )); then  # This runs "1 + 1" as a command!
```

**Correct approaches:**
```bash
# For arithmetic:
if (( 1 + 1 > 1 )); then
  echo "yes"
fi

# For floating-point:
if (( $(echo "1.5 + 1.5" | bc -l) > 2 )); then
  echo "yes"
fi
```

---

### Mistake 3: Not Quoting Variables in `[[ ]]`

```bash
if [[ $var -gt 10 ]]; then  # OK in [[ ]], but still a good habit to quote
```

While `[[ ]]` doesn't require quoting (it's more forgiving than `[ ]`), teach the habit anyway:
```bash
if [[ "$var" -gt 10 ]]; then  # Better style, future-proof
```

---

### Mistake 4: Using `bc` Without `-l`

```bash
echo "2.5 > 2.0" | bc  # Returns 0 (false), should return 1 (true)
echo "2.5 > 2.0" | bc -l  # Returns 1 (true) — correct
```

The `-l` flag loads the math library, needed for proper floating-point handling.

---

### Mistake 5: Exiting Inside a Function

```bash
check_cpu() {
  if [[ $load -gt 2 ]]; then
    log "High CPU"
    exit 1  # Script exits here! Other checks don't run.
  fi
}
```

**Fix:** Use a flag (WARN/FAIL) instead and exit in main:
```bash
check_cpu() {
  if [[ $load -gt 2 ]]; then
    log "High CPU"
    WARN=1
    return
  fi
}
```

---

### Mistake 6: Forgetting `-u` in `set -euo pipefail`

Without `set -u`, undefined variables silently expand to empty strings:
```bash
# Without set -u:
echo "$LOGG"  # Typo, but expands to "" — silently wrong!

# With set -u:
echo "$LOGG"  # Error: LOGG: unbound variable
```

Emphasize: Always use `set -euo pipefail` at the top of scripts.

---

### Mistake 7: Not Checking df/free Output Format

Different systems might have slightly different `df` and `free` output. For robustness:
- Test `df /` on the student's system before assuming NR==2
- Test `free` format (older vs. newer systems might differ)

The solution uses the most common format; if a student's system differs, walk them through fixing the awk fields.

---

## Solution Walkthrough

### Structure
1. **Header**: `#!/bin/bash` and `set -euo pipefail`
2. **Initialization**: `LOG=`, `WARN=0`, `FAIL=0`, clear log
3. **log() function**: Handles timestamps and tee
4. **check_*() functions**: One per system check
5. **main()**: Orchestrates all checks, prints summary, exits with correct code

### Key Points to Discuss

**Logging pattern:**
```bash
log() {
  local message="$1"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] ${message}" | tee -a "$LOG"
}
```
- `tee -a` writes to both stdout and log file
- Timestamp added centrally (one place to maintain)
- Used for both regular output and summary

**CPU check with bc:**
```bash
if (( $(echo "$load_avg > 2.0" | bc -l) )); then
```
This is the idiomatic way; emphasize it early so students learn it.

**Service check robustness:**
```bash
if systemctl is-active --quiet "$service" 2>/dev/null; then
```
The `2>/dev/null` suppresses errors if service doesn't exist.

**Exit logic:**
```bash
if (( FAIL > 0 )); then
  exit 1
elif (( WARN > 0 )); then
  exit 1
else
  exit 0
fi
```
Both FAIL and WARN exit non-zero, but the log distinguishes them.

---

## Timing Guide

- **5 minutes**: Read exercise, ask clarifying questions
- **10 minutes**: Write and test the script (aim for minimal viable version)
- **5 minutes**: Run shellcheck, fix any warnings
- **15 minutes**: Walkthrough the solution, discuss design decisions
- **5 minutes**: Extension ideas (see below)

---

## Extension Ideas (If time allows)

1. **Add more services**: Check `nginx`, `mysql`, `docker`, etc.
2. **Check additional partitions**: Warn if `/home` or `/var` is full
3. **Disk I/O check**: Use `iostat` to check disk wait time
4. **Temperature check**: Use `sensors` to monitor CPU temp
5. **Cron integration**: Make it run every 5 minutes and email alerts on FAIL
6. **Argument parsing**: Accept a service list as arguments: `./health_check.sh ssh nginx postgresql`

---

## Common Questions Students Ask

**Q: Why use `tee -a` instead of just `>> "$LOG"`?**
A: `tee` writes to both stdout and file. Without it, you'd only see output in the log, not on screen.

**Q: What if a service doesn't exist (e.g., postgresql isn't installed)?**
A: Add `2>/dev/null || true` to prevent the check from failing. Or make the service list configurable (extension idea).

**Q: Should I use `[ ]` or `[[ ]]`?**
A: `[[ ]]` is safer (fewer quoting issues) and more portable in modern bash. Teach `[[ ]]` as the standard.

**Q: Why `set -euo pipefail`?**
A: 
- `-e` = exit on error
- `-u` = exit if undefined variable
- `-o pipefail` = exit if any command in a pipeline fails
This prevents silent failures.

**Q: Can I use different thresholds (e.g., WARN at 80% CPU)?**
A: Absolutely! Real scripts are customized. Make it configurable with variables at the top.

---

## Assessment Rubric

A passing script should:
- [ ] Execute without errors (`chmod +x` and run successfully)
- [ ] Pass `shellcheck` with zero warnings
- [ ] Log all checks with timestamps to `/tmp/health_check.log`
- [ ] Exit 0 on PASS, non-zero on WARN/FAIL
- [ ] Check all 5 categories (CPU, disk, memory, services, network)
- [ ] Use proper quoting for all variables
- [ ] Have a `log()` function and use it consistently
- [ ] Have separate check functions (not monolithic)

Bonus points:
- [ ] Comments explaining complex awk/bc operations
- [ ] Handles edge cases (service doesn't exist, network unreachable)
- [ ] Configurable thresholds as variables

---

## Real-World Context

This script is the foundation for:
- **Monitoring dashboards**: Cron runs it every 5 min, collects exit codes
- **Alert systems**: Exit 1 triggers PagerDuty/Slack notification
- **Incident response**: The log file is attached to incident reports
- **Baseline health**: Part of onboarding new sysadmins to check system state

In production, you'd add:
- Remote logging (syslog, ELK stack)
- Alerting thresholds (different for dev vs. production)
- Performance baselines (historical data)
- Custom service lists per environment

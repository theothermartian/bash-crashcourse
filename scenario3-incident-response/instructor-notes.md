# Instructor Notes: Scenario 3 — Incident Response

## Overview

This lab teaches students to:
1. Read logs without modifying them (audit trail discipline)
2. Use grep patterns with extended regex (`-E` flag)
3. Extract structured data from unstructured logs with `grep -oE`
4. Chain pipes to tell a story (each stage adds specificity)
5. Reason about root cause from log evidence

---

## Key Teaching Moments

### 1. Read Before Act (Read-Only Constraint is Intentional)

The read-only rule is not arbitrary — it mirrors real incident response discipline. Explain:

- **Audit trails:** Every file touch is logged. A good responder never modifies the crime scene.
- **Correlation with syslog:** If students restart services, the timestamps become confounded. When did it actually fail?
- **Legal/compliance:** Nuclear facilities (and financial services, healthcare) must preserve evidence for root cause analysis and regulatory review.

**Teaching tip:** Ask students: "If you restart postgres now, how will the next engineer know whether the problem was 03:00 or happened during your investigation?"

### 2. Grep Patterns: From Simple to Structured Extraction

Students often write `cat file | grep` when they should write `grep file`. Model the evolution:

```bash
# Bad: wasteful (useless use of cat)
cat incident.log | grep ERROR

# Good: efficient
grep ERROR incident.log

# Better: match multiple patterns
grep -E "ERROR|FATAL|CRITICAL" incident.log

# Best: extract structured data from unstructured logs
grep "Failed password" incident.log | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c
```

**Teaching tip:** Pause after each pipe and ask "What does this stage output?" Walk through the actual data:
- Stage 1: grep lines with "Failed password" → full lines with login attempts
- Stage 2: grep -oE extracts only IP addresses → one IP per line
- Stage 3: sort | uniq -c → counts per IP → allows sorting next

### 3. Pipe Chains Tell a Story

Each pipe stage should have a clear purpose. Use the postgres error task to show this:

```bash
grep "postgres" incident.log              # Filter to postgres mentions only
  | grep -E "ERROR|FATAL"                 # Keep only error lines
  | awk -F'] ' '{print $NF}'              # Extract the error message (text after last '] ')
  | sort                                  # Prepare for uniq
  | uniq -c                               # Count occurrences of each error
  | sort -rn                              # Sort by count, descending
  | head -10                              # Show top 10
```

**Teaching tip:** Have students add intermediate `| cat` to inspect the output at each stage (without actually modifying files).

### 4. Root Cause Reasoning

Students often jump to "the error happened, so it caused the outage." Teach causality:

- **Timeline matters:** If postgres crashed at 03:00:02 and monitoring went down at 03:00:03, which caused which?
- **Correlation vs. causation:** The brute force attack (192.168.1.200) looks suspicious. Is it related? Probably not — it's ongoing, but the outage lasted 5 minutes. Discuss: "What's the evidence? Just seeing errors from both doesn't mean one caused the other."

**Expected root cause narrative:**
1. **03:00:02** — Postgres connection pool exhaustion (too many concurrent connections)
2. **03:00:13** — OOM killer triggered, killed postgres processes (symptoms: "out of memory" errors)
3. **03:00-03:05** — System monitoring was offline (likely killed by OOM as well)
4. **03:05** — Postgres restarted (possibly due to systemd restart on-failure)
5. **Brute force:** Separate issue, ongoing, unrelated to the outage window

---

## What Students Should Conclude

When students complete the lab correctly, they should write (approximately):

```
Time Window: 2024-03-15 03:00:02 to 03:05:47 (5 minutes 45 seconds)

Root Cause Assessment:
Postgres reached maximum connection limit at 03:00:02, rejecting new connections.
This overloaded the system, triggering OOM killer at 03:00:13. Postgres recovered at 03:05.

Errors by Severity:
  15 ERROR
   3 FATAL
   7 CRITICAL

Suspicious Activity:
192.168.1.200 — 45 failed password attempts
Assessment: Ongoing brute force attack, but timing does not correlate with outage.
Secondary finding; likely unrelated to reactor-srv1 failure.

Top Postgres Errors:
  28 remaining connection slots reserved for non-replication superuser connections
   8 out of memory
   3 role "dbuser" does not exist
```

### Evidence Interpretation

- **Connection limit error (28 occurrences):** Primary cause. Postgres was full.
- **Out of memory errors (8):** Secondary effect. OOM killer had to act.
- **Role errors (3):** Unrelated; likely background connection attempts from failed startup scripts.

---

## Common Mistakes (and How to Correct)

### Mistake 1: Trying to Restart Services

**What:** Student runs `sudo systemctl restart postgresql`

**Why it's wrong:** Violates read-only constraint; obscures what actually happened

**Correction:** Stop them immediately. Explain: "In a real incident, that action would be logged and reviewed. You've now hidden the original failure mode. Good responders never touch the system until they've documented the current state."

### Mistake 2: Using `cat | grep` Instead of `grep file`

**What:** `cat incident.log | grep ERROR`

**Why it's wrong:** Wasteful (spawns extra process), violates Unix philosophy

**Correction:** Show them side-by-side. Explain: "The pipe is for combining tools, not for feeding a file to a tool that takes files as arguments."

### Mistake 3: Not Using `-E` for Multi-Pattern Grep

**What:** `grep "ERROR" incident.log | grep "FATAL" | grep "CRITICAL"`

**Why it's wrong:** Three passes, hard to read, doesn't scale

**Correction:** Teach the `-E` flag: `grep -E "ERROR|FATAL|CRITICAL"`. Show that `|` inside quotes means "or" to grep, not pipes.

### Mistake 4: Forgetting `|| true` with `grep -c` Under `set -e`

**What:** Script exits early because `grep -c NONEXISTENT file` returns 1

**Why it's hard:** With `set -e`, a command that exits 1 aborts the script

**Correction:** Always use `grep -c PATTERN file || true` when you want grep to not fail the script. The `|| true` means "if the previous command failed, run true (which always succeeds)."

**Example in analyze.sh:**
```bash
count=$(grep -c "$severity" "$LOG" || true)
```

Without `|| true`, if that severity doesn't appear, grep exits 1 and the script crashes.

---

## Timing (Reference)

- **Read brief:** 3 minutes
- **Tasks A-D (running grep pipelines):** 10 minutes (many students need to iterate)
- **Write incident report (Task E):** 13 minutes (documentation and reasoning)
- **Instructor walkthrough:** 15 minutes (go through solution, discuss root cause, take questions)

**Total:** ~40 minutes lab + discussion

---

## Instructor Walkthrough Script

1. **Start with a question:** "What's the first thing you did? Did you touch the system?"
   - If yes: "Why? How do you know you didn't make it worse?"
   - If no: "Good. In incident response, you only get one chance to read the logs."

2. **Walk Task A:** Show that `grep -c` is efficient. Discuss: "Why is ERROR count high? Let's check what triggers it."

3. **Walk Task B:** Extract timestamps from the first and last errors. Ask: "How long did the incident last? Is there a pattern?" (You'll see errors spike between 03:00 and 03:05.)

4. **Walk Task C:** Show that 192.168.1.200 is clearly brute forcing. Ask: "Is this the cause of the outage? Why or why not?" (Timing doesn't match; it's ongoing.)

5. **Walk Task D:** Highlight the "connection slots reserved" error. Ask: "What does this mean?" (Postgres is full, refusing new connections). Then show the "out of memory" errors. Ask: "When did these start?" (After connection exhaustion.)

6. **Root cause narrative:** Timeline on whiteboard:
   - 03:00:02 — Connection limit hit (evidence: logs)
   - 03:00:13 — OOM killer triggered (evidence: "out of memory" error)
   - 03:05 — Recovery begins (gap in error logs)
   - Brute force: Separate issue, ongoing for hours (not 5 min window)

7. **Debrief:** "Why did we not restart postgres? Because if we had, we'd never know it was the connection limit. The next engineer would see it restart cleanly and think it was a transient issue. Now we know: we need to increase `max_connections` in postgres.conf."

---

## Lab Variations (Advanced)

If students finish early or if running a more advanced cohort:

1. **Extend Task D:** What was the system doing to cause connection exhaustion? (Look for batch jobs, connection pools not closing properly.)

2. **Add Task F:** "Write a prometheus alerting rule that would have caught this before it caused an outage." (Example: alert when postgres connection count > 80% of max_connections)

3. **Add Task G:** "If you could change one thing to prevent this, what would it be?" (Discuss: pool size, alerting, graceful degradation, circuit breakers.)

---

## Safety & Compliance Notes

- This lab models nuclear facility incident response (read-only audit trail).
- In real scenarios, students would have a separate test environment for destructive troubleshooting.
- The read-only constraint teaches discipline; production incident response requires legal/compliance review before any changes.
- Student incident reports become part of the facility's incident log.

---

## Common Questions from Students

**Q:** "Can I use Python / awk / perl to parse the logs?"

**A:** Yes, absolutely. The hints use shell pipelines because they're concise, but parsing is parsing. Show them awk if they want to extract fields; teach them that awk is just a more powerful grep.

**Q:** "What if the logs are corrupted?"

**A:** Good question. In this scenario, assume they're clean. In real life, check: `file incident.log`, look for truncation, check syslog. But with set -e, corrupted lines will just get skipped by grep.

**Q:** "Should I write the incident_report.txt myself or use a script?"

**A:** Both are fine. Task E asks for manual writing to teach reasoning; a script would also be acceptable for Task A-D output. Let students choose.


# Scenario 3: Incident Response

## Mission Brief

It's 07:00. Something went wrong with reactor-srv1 around 03:00 last night. Find out what happened — without making it worse.

Your job: analyze the incident logs, extract key facts, and write a detailed incident report. You have full read access to all logs. Do not touch anything else.

---

## The Rules

**READ ONLY** — this is an audit trail. Do not:
- Restart services
- Delete files  
- Modify anything

All output goes to `~/incident_report.txt`

---

## Log File Location

- **Log file:** `~/labs/shared/incident.log`
- **Output file:** `~/incident_report.txt`

---

## Tasks

### Task A: Severity Breakdown

Count lines containing each severity level (ERROR, FATAL, CRITICAL).

**Hint:** Use `grep -c` or `grep | sort | uniq -c`

Example output:
```
15 ERROR
3 FATAL
7 CRITICAL
```

### Task B: Error Time Window

Find the first and last error timestamps (ERROR, FATAL, or CRITICAL).

**Hint:** 
```bash
grep "ERROR\|FATAL\|CRITICAL" | head -1
grep "ERROR\|FATAL\|CRITICAL" | tail -1
```

Extract the timestamp from each line.

Example output:
```
First error: 2024-03-15 03:00:02
Last error:  2024-03-15 03:05:47
```

### Task C: Suspicious IPs

Which IP triggered auth failures and how many attempts?

**Hint:** `grep "Failed password" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c`

Example output:
```
     45 192.168.1.200
      2 10.0.0.50
```

### Task D: Top Postgres Errors

List unique postgres error messages sorted by frequency (top 10).

**Hint:** `grep "postgres" | grep -E "ERROR|FATAL" | awk -F'] ' '{print $NF}' | sort | uniq -c | sort -rn`

Example output:
```
     28 remaining connection slots reserved for non-replication superuser connections
      8 out of memory
      3 role "dbuser" does not exist
```

### Task E: Write the Incident Report

Write `~/incident_report.txt` with these 5 sections:

1. **Time Window:** First error at HH:MM:SS, last error at HH:MM:SS (duration)
2. **Root Cause Assessment:** What happened and why (1-2 sentences)
3. **Errors by Severity:** Table with counts from Task A
4. **Suspicious Activity:** IP address(es), number of attempts, and assessment
5. **Top Postgres Errors:** List from Task D with brief interpretation

---

## Expected Findings

When you analyze the logs correctly, you should discover:

- **Connection limit hit:** Postgres reached max connections around 03:00:02
- **OOM killer:** System ran out of memory at 03:00:13, killing postgres processes
- **Monitoring gap:** System monitoring was down for ~5 minutes (03:00 - 03:05)
- **Brute force attack:** 192.168.1.200 attempted 45+ failed password logins (likely unrelated to the outage)

---

## Submission

When finished, check that `~/incident_report.txt` exists and contains all 5 sections. Instructors will verify your analysis against the expected findings.

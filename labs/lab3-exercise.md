# Lab 3: Log Analysis with Pipes

**Module:** 3 — Text Processing & Pipes
**Time:** 10 minutes
**VM:** vm1

---

## Setup

The instructor has placed a sample log file at `/opt/crashcourse/lab3/sample.log`. Verify it exists:
```bash
wc -l /opt/crashcourse/lab3/sample.log
```

You should see a number around 500 lines.

Create your working area:
```bash
mkdir -p ~/crashcourse/lab3
cd ~/crashcourse/lab3
```

---

## Step 1: Inspect the log

Look at the first 10 and last 10 lines:
```bash
head -10 /opt/crashcourse/lab3/sample.log
tail -10 /opt/crashcourse/lab3/sample.log
```

Count the total lines:
```bash
wc -l /opt/crashcourse/lab3/sample.log
```

---

## Step 2: Find ERROR lines

Find all lines containing `ERROR`:
```bash
grep "ERROR" /opt/crashcourse/lab3/sample.log
```

Count how many ERROR lines there are:
```bash
grep -c "ERROR" /opt/crashcourse/lab3/sample.log
```

Find lines containing either `ERROR` or `CRITICAL`:
```bash
grep -E "ERROR|CRITICAL" /opt/crashcourse/lab3/sample.log
```

---

## Step 3: Count unique error types

The log format is:
```
TIMESTAMP LEVEL SERVICE MESSAGE
```
Example:
```
2026-04-09 08:14:02 ERROR db-service Connection timeout to 192.168.1.55
```

Count how many times each log LEVEL appears:
```bash
awk '{print $3}' /opt/crashcourse/lab3/sample.log | sort | uniq -c | sort -rn
```

What is the most frequent log level?

---

## Step 4: Extract unique IPs

Many log entries contain IP addresses in the format `192.168.x.x`. Extract all IPs and list them uniquely:
```bash
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' /opt/crashcourse/lab3/sample.log | sort | uniq -c | sort -rn
```

How many unique IPs appear in the log?

---

## Step 5: Extract timestamps of ERROR events

Extract just the timestamp (column 1 and 2) from ERROR lines:
```bash
grep "ERROR" /opt/crashcourse/lab3/sample.log | awk '{print $1, $2}'
```

Save the ERROR-only lines to a file in your working directory:
```bash
grep "ERROR" /opt/crashcourse/lab3/sample.log > ~/crashcourse/lab3/errors_only.log
wc -l ~/crashcourse/lab3/errors_only.log
```

---

## Step 6: Redirect stdout and stderr

Run a command that produces both stdout and stderr:
```bash
find /opt/crashcourse -name "*.log" > ~/crashcourse/lab3/found_logs.txt 2> ~/crashcourse/lab3/find_errors.txt
```

Inspect both output files:
```bash
cat ~/crashcourse/lab3/found_logs.txt
cat ~/crashcourse/lab3/find_errors.txt
```

Now combine both into one file:
```bash
find /opt/crashcourse -name "*.log" > ~/crashcourse/lab3/all_output.txt 2>&1
cat ~/crashcourse/lab3/all_output.txt
```

---

## Checkpoint

Before moving on, confirm:
- [ ] You found and counted ERROR lines using grep
- [ ] You used awk to extract a specific column
- [ ] You used the `sort | uniq -c | sort -rn` pipeline
- [ ] You redirected stdout and stderr to separate files
- [ ] You extracted unique IPs from the log

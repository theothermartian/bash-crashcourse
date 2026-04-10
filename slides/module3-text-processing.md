# Module 3 — Text Processing & Pipes
**Duration:** 20 min (10 min lecture + 10 min Lab 3)

---

## Slide 3-1: The Safety Warning

> "Text processing is where sysadmins extract signal from noise. During an incident, log files are your only source of truth. If you cannot read logs quickly, you are blind."

No single command kills a system in this module — but inability to read logs kills your response time.

---

## Slide 3-2: Reading Files

```
cat file.txt           — print entire file
less file.txt          — page through (q to quit, / to search)
head -20 file.txt      — first 20 lines
tail -20 file.txt      — last 20 lines
tail -f file.txt       — follow live updates (for active logs)
tail -f -n 100 file    — last 100 lines, then follow
```

- `tail -f` is the most-used command during a live incident
- `less` is safer than `cat` for large files — never cat a 2GB log

---

## Slide 3-3: Searching — grep

```
grep "ERROR" file.log           — lines containing ERROR
grep -i "error" file.log        — case-insensitive
grep -r "pattern" /var/log/     — search all files in directory
grep -E "ERR|WARN|CRIT" file    — extended regex (multiple patterns)
grep -v "DEBUG" file.log        — invert: lines NOT matching
grep -c "ERROR" file.log        — count matching lines
grep -n "ERROR" file.log        — show line numbers
grep -A 3 "ERROR" file.log      — 3 lines after each match (context)
grep -B 2 "ERROR" file.log      — 2 lines before each match
```

---

## Slide 3-4: Counting, Sorting, Deduplication

```
wc -l file              — count lines
wc -c file              — count bytes
sort file               — sort alphabetically
sort -n file            — sort numerically
sort -rn file           — sort numerically, reversed
sort -k2 file           — sort by 2nd field
uniq file               — remove adjacent duplicates (must sort first)
uniq -c file            — prefix with count of occurrences
sort | uniq -c | sort -rn    — frequency count pattern
```

- The `sort | uniq -c | sort -rn` pipeline is a fundamental sysadmin idiom

---

## Slide 3-5: Extracting Fields

```
cut -d: -f1 /etc/passwd       — delimiter=:, field 1
cut -d, -f2,4 data.csv        — fields 2 and 4 from CSV
awk '{print $1}' file         — print first space-delimited field
awk '{print $1, $3}' file     — print fields 1 and 3
awk -F: '{print $1}' /etc/passwd    — awk with delimiter
awk '$3 > 1000 {print $1}' file     — conditional: print field 1 if field 3 > 1000
tr 'a-z' 'A-Z'               — translate: lowercase to uppercase
tr -d '\r'                   — delete carriage returns (Windows line endings)
```

---

## Slide 3-6: Stream Editing — sed

```
sed 's/old/new/' file         — replace first occurrence per line
sed 's/old/new/g' file        — replace all occurrences per line
sed -i 's/old/new/g' file     — in-place edit (MODIFIES THE FILE)
sed -n '5,10p' file           — print lines 5 through 10
sed '/pattern/d' file         — delete lines matching pattern
```

- `sed -i` modifies the file in place. Always backup first: `cp file file.bak`
- Nuclear rule: never `sed -i` on a production config without a backup

---

## Slide 3-7: Redirection

```bash
cmd > file          # stdout to file (overwrites existing content)
cmd >> file         # stdout append to file
cmd 2> errors.log   # stderr only to file
cmd 2>&1            # redirect stderr to wherever stdout goes
cmd > out.log 2>&1  # both stdout and stderr to same file
cmd | next          # pipe stdout to next command's stdin
cmd > /dev/null     # discard stdout
cmd 2>/dev/null     # discard stderr
cmd &>/dev/null     # discard both (bash-specific)
```

- `>` overwrites. `>>` appends. Know which you mean.
- `2>&1` must come AFTER the output redirection

---

## Slide 3-8: The Pipe — Composing Tools

```bash
# Count ERRORs by type in a log
grep "ERROR" app.log | awk '{print $5}' | sort | uniq -c | sort -rn

# Find top 10 IPs hitting a web server
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# Extract all unique usernames from auth log
grep "Accepted" /var/log/auth.log | awk '{print $9}' | sort -u

# Monitor a log and alert on ERROR (live)
tail -f app.log | grep --line-buffered "ERROR"
```

- Each tool does one thing. Pipes compose them.
- Read left-to-right: data flows from left to right through each filter

---

## Instructor Notes

**Timing:** 10 min lecture, 10 min lab. This module runs fast — `grep` and pipes are familiar to CS students. Spend more time on `awk` and redirection.

**What to emphasize:**
- The `sort | uniq -c | sort -rn` pattern. Call it the "frequency idiom." Daily sysadmin tool.
- `tail -f` during a live incident. This is the first command any sysadmin opens.
- The difference between `>` and `>>`. A misplaced `>` has deleted days of log data.
- `2>&1` ordering — if they swap the order they get surprising results. Show this.

**Demo idea:** Open a second terminal, run `tail -f /var/log/syslog`, then in the first terminal run `logger "TEST MESSAGE FROM STUDENT"`. Students see it appear live. 30 seconds, makes `tail -f` memorable.

**Common student mistakes:**
- Using `cat file | grep "pattern"` instead of `grep "pattern" file` — useless use of cat
- `grep` without `-r` on a directory — it errors instead of searching recursively
- Forgetting that `uniq` requires sorted input — show what happens with unsorted input
- `sed -i` without a backup. Drill this: `cp file file.bak` before any `sed -i`
- Using `awk '{print $1}'` when the delimiter isn't whitespace — they need `-F`

# Bash Crashcourse — Part 1 Implementation Plan
**Date:** 2026-04-09
**Scope:** Part 1 only — 8 modules, ~3 hours
**Audience:** CS-background students becoming sysadmins/DBAs on a nuclear project
**Environment:** Ubuntu live lab VMs (two VMs per student for Module 6 SSH labs)

---

## How to Read This Plan

Each module is broken into four sections:

- **Slides** — exact bullet points per slide, in presentation order
- **Lab exercise** — full written instructions students will follow verbatim
- **Code/scripts** — exact content of every file students type or receive
- **Instructor notes** — what to emphasize, common mistakes to watch for, timing cues

Build order follows the numbered steps at the bottom. Slides and labs for each module are independent of each other's content but both must exist before the module can be delivered.

---

## Module 1 — Bash Fundamentals & The Nuclear Mindset (20 min)

### 1.1 Slides

---

**Slide 1-1: What Is Bash?**
- Bash = Bourne Again Shell. Every Linux system has it. Not optional.
- A bash script is a list of commands the OS executes top-to-bottom
- You will read and write these every day as a sysadmin/DBA
- Unlike Python: no imports, no classes, no garbage collector — just the OS

---

**Slide 1-2: How Bash Is Different From What You Know**
- Whitespace is syntax. `x=1` works. `x = 1` does not.
- No types. Everything is a string. Arithmetic is explicit.
- Exit codes are backwards: `0` = success, anything else = failure
- The shell runs on your real system. A typo can delete real files.
- There is no "undo"

---

**Slide 1-3: The Safety Warning (say this out loud)**
> "Every script in this room runs against a real Ubuntu VM. It is not sandboxed. A bad command will break your VM. That is acceptable here — it is not acceptable in production. Treat every exercise like production anyway."

- This framing applies at the nuclear facility: there are no "dev" environments that cannot hurt you
- Build the habit now: slow down, read before you run

---

**Slide 1-4: The Standard Script Header — Every Single Script**
```bash
#!/bin/bash
set -euo pipefail
```
- `#!/bin/bash` — shebang. Tells the OS which interpreter to use. Never omit it.
- `set -e` — exit immediately on any command that returns non-zero
- `set -u` — treat unset variables as errors (catches typos in var names)
- `set -o pipefail` — a pipe fails if ANY command in it fails (not just the last)
- Without this header, errors are silently swallowed

---

**Slide 1-5: Exit Codes**
- Every command returns an exit code when it finishes
- `0` = success. `1`–`255` = failure (meaning varies by program)
- Check the last exit code: `echo $?`
- This is how scripts detect whether a previous step succeeded
- Databases: if `pg_dump` exits non-zero, the backup is bad. Your script must detect this.

---

**Slide 1-6: The Quoting Law**
- Always quote variables: `"$varname"` not `$varname`
- Unquoted: bash splits the value on spaces and expands globs
- Example: `dir=""` then `rm -rf $dir/*` → removes everything in current directory
- Quoted: `rm -rf "$dir"/*` → bash catches the empty string
- Nuclear rule: **if the variable touches a path, a command, or a filename — quote it**

---

**Slide 1-7: shellcheck — Your Mandatory Linter**
- `shellcheck script.sh` — static analysis, catches bugs before they run
- Catches: unquoted variables, undefined variables, bad conditionals, portability issues
- Run it before executing any script. No exceptions.
- If shellcheck complains and you don't understand why — ask before running
- Install: `sudo apt install shellcheck`

---

**Slide 1-8: The Nuclear Rules (post this on your wall)**
1. `set -euo pipefail` on every script
2. Quote every variable: `"$var"`
3. Dry-run before destructive operations
4. Never `rm -rf` without a guard check on the variable
5. `shellcheck` before executing any script
6. Back up before modifying
7. Document every `sudo` operation and why
8. If you don't know what a command does — do not run it

---

### 1.2 Lab Exercise — Lab 1

**Lab 1: Your First Script and Shellcheck**
**Time:** 10 minutes
**VM:** vm1 (your primary VM)

---

**Setup**

Open a terminal on your VM. Confirm your working directory:
```
pwd
```
You should see your home directory, e.g. `/home/student`.

Create a directory for today's exercises:
```bash
mkdir -p ~/crashcourse/lab1
cd ~/crashcourse/lab1
```

---

**Step 1: Write the script**

Open a new file in a text editor:
```bash
nano hello.sh
```

Type the following exactly — do not copy-paste, type it:
```bash
#!/bin/bash
set -euo pipefail

facility_name="Reactor Block A"
operator="$(whoami)"

echo "Facility: $facility_name"
echo "Operator: $operator"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
```

Save and exit: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

**Step 2: Run shellcheck**

```bash
shellcheck hello.sh
```

Expected output: no warnings. If you see warnings, read them carefully and fix the script before continuing.

---

**Step 3: Make it executable and run it**

```bash
chmod +x hello.sh
./hello.sh
```

Expected output (values will differ):
```
Facility: Reactor Block A
Operator: student
Time: 2026-04-09 09:14:23
```

---

**Step 4: Introduce a quoting bug — watch shellcheck catch it**

Edit the file:
```bash
nano hello.sh
```

Change the `echo` line for `facility_name` to remove the quotes:
```bash
echo "Facility: " $facility_name
```

Save and run shellcheck:
```bash
shellcheck hello.sh
```

Read the warning shellcheck produces. Note the line number and the message.

Now restore the correct quoting:
```bash
echo "Facility: $facility_name"
```

Save, run shellcheck again — confirm no warnings.

---

**Step 5: Check exit codes**

Run the script, then immediately check its exit code:
```bash
./hello.sh
echo "Exit code: $?"
```

Now intentionally cause a failure:
```bash
ls /nonexistent_path
echo "Exit code: $?"
```

The exit code should be non-zero. Note what number it is.

---

**Checkpoint:** Before moving on, confirm:
- [ ] `hello.sh` runs without errors
- [ ] `shellcheck hello.sh` produces no warnings
- [ ] You have seen and understand what an exit code looks like
- [ ] You understand why the quoting warning appeared

---

### 1.3 Instructor Notes — Module 1

**Timing:** Lecture 10 min, lab 10 min. Do not let lecture run over — the lab is where concepts land.

**What to emphasize:**
- The `set -euo pipefail` header is non-negotiable. Every script, forever, no exceptions. Say this three times.
- The quoting law is the #1 source of production incidents from shell scripts. Make it visceral.
- shellcheck is not optional. Frame it as: "would you push code without running the compiler?"

**Common student mistakes:**
- Putting spaces around `=` in variable assignment (`x = 1`). Show the error message immediately.
- Forgetting the shebang line — script may run under `sh` which has subtly different behavior
- Running `shellcheck` and ignoring the output because they don't understand it. Force them to read and understand each warning before moving on.
- Typing the shebang as `#!/usr/bin/bash` — mention both paths exist, `#!/bin/bash` is conventional

**Demo tip:** Before the lab, open a terminal and type `x = 1` live to show the error. Then type `x=1; echo $x`. The contrast lands better than explaining.

**Safety note to make explicit:** When students see `set -e`, some will disable it to "make the script easier to debug." Pre-empt this: disabling safety features in a nuclear environment is a procedural violation. Embrace the errors — they are information.

---

---

## Module 2 — Navigation & File Operations (20 min)

### 2.1 Slides

---

**Slide 2-1: The Safety Warning**
> "`rm -rf $dir/*` with an unset or empty `$dir` will delete your current working directory. This has happened in production. It has taken down systems. We will reproduce it safely right now."

---

**Slide 2-2: Orientation Commands**
```
pwd          — print working directory (where am I?)
ls -la       — list all files including hidden, with permissions
cd /path     — change directory (absolute)
cd ../       — go up one level (relative)
cd ~         — go home
cd -         — go to previous directory
```
- `ls -la` output columns: permissions | links | owner | group | size | date | name
- Hidden files start with `.` (dotfiles) — `-a` flag shows them

---

**Slide 2-3: Finding Files**
```
find /path -name "*.log"            — find by name pattern
find /path -type f -name "*.conf"   — files only, not directories
find /path -type d                  — directories only
find /path -mtime -1                — modified in last 24 hours
find /path -size +100M              — larger than 100 MB
find /path -name "*.sh" -executable — executable scripts
```
- `find` searches recursively by default
- Use `-maxdepth 2` to limit how deep it searches

---

**Slide 2-4: Copying, Moving, Deleting**
```
cp source dest          — copy file
cp -r source/ dest/     — copy directory recursively
mv source dest          — move or rename
rm file                 — delete file (NO UNDO)
rm -r directory/        — delete directory recursively (DANGEROUS)
mkdir newdir            — create directory
mkdir -p a/b/c          — create full path including parents
```
- `mv` is "safe" — it doesn't copy, it relocates
- `rm` is permanent. There is no trash can in the shell.

---

**Slide 2-5: The rm Guard Pattern — Memorize This**
```bash
# NEVER do this without a guard:
rm -rf "$dir"/*

# ALWAYS guard first:
[[ -n "$dir" ]] || { echo "ERROR: dir variable is empty or unset"; exit 1; }
rm -rf "$dir"/*
```
- `[[ -n "$var" ]]` — true if variable is non-empty
- The `||` pattern: "if previous command failed, run this block"
- This one pattern has saved systems. Use it. Always.

---

**Slide 2-6: Permissions**
```
chmod 755 file      — rwxr-xr-x  (owner: full, group/other: read+execute)
chmod 640 file      — rw-r-----  (owner: read+write, group: read, other: none)
chmod 600 file      — rw-------  (owner only — for private keys, credentials)
chmod +x file       — add execute for all
chmod u+x file      — add execute for owner only
chown user:group file
chgrp group file
```
- Numeric: first digit = owner, second = group, third = other
- Values: 4=read, 2=write, 1=execute. Add them: 7=rwx, 6=rw-, 5=r-x, 4=r--
- Config files with credentials: always `600` or `640`. Never `777`.

---

**Slide 2-7: File Testing Operators**
```bash
[[ -f "$path" ]]   — true if file exists and is a regular file
[[ -d "$path" ]]   — true if directory exists
[[ -e "$path" ]]   — true if anything exists at this path
[[ -x "$path" ]]   — true if file is executable
[[ -s "$path" ]]   — true if file exists and is non-empty
[[ -r "$path" ]]   — true if file is readable
```
- Always test before operating: before reading, before deleting, before executing
- Use these as guards in every script that touches files

---

**Slide 2-8: Symlinks**
```
ln -s /actual/path /link/name   — create symbolic link
ls -la                          — shows link → target
readlink -f /link/name          — resolve the real path
```
- Symlinks are pointers. Deleting the link does not delete the target.
- Deleting the target leaves a "dangling" link.
- Common use: `/var/log/app/current` → `app-2026-04-09.log`

---

### 2.2 Lab Exercise — Lab 2

**Lab 2: Navigation, Find, Permissions, Symlinks**
**Time:** 10 minutes
**VM:** vm1

---

**Setup**

The instructor will have pre-staged a directory tree on your VM at `/opt/crashcourse/lab2/`. Verify it exists:
```bash
ls /opt/crashcourse/lab2/
```

You should see:
```
configs/    logs/    scripts/    data/
```

Create your working area:
```bash
mkdir -p ~/crashcourse/lab2
cd ~/crashcourse/lab2
```

---

**Step 1: Navigate and observe**

Without changing directory, list the contents of the staged tree:
```bash
ls -la /opt/crashcourse/lab2/
ls -la /opt/crashcourse/lab2/configs/
ls -la /opt/crashcourse/lab2/scripts/
```

Record answers to:
- How many files are in `scripts/`?
- What are the permissions on `configs/database.conf`?
- Which files in `scripts/` are executable?

---

**Step 2: Find files by extension**

Find all `.log` files anywhere in the lab2 tree:
```bash
find /opt/crashcourse/lab2 -type f -name "*.log"
```

Find all `.conf` files:
```bash
find /opt/crashcourse/lab2 -type f -name "*.conf"
```

Find any file larger than 1KB:
```bash
find /opt/crashcourse/lab2 -type f -size +1k
```

---

**Step 3: Fix a broken script**

There is a script at `/opt/crashcourse/lab2/scripts/broken_monitor.sh`. Copy it to your working directory:
```bash
cp /opt/crashcourse/lab2/scripts/broken_monitor.sh ~/crashcourse/lab2/
```

Check its current permissions:
```bash
ls -la ~/crashcourse/lab2/broken_monitor.sh
```

Try to run it:
```bash
./broken_monitor.sh
```

You should get a "Permission denied" error. Fix the permissions:
```bash
chmod +x ~/crashcourse/lab2/broken_monitor.sh
```

Try to run it again:
```bash
./broken_monitor.sh
```

Now run shellcheck on it:
```bash
shellcheck ~/crashcourse/lab2/broken_monitor.sh
```

Read any warnings. Do not fix them yet — just observe.

---

**Step 4: Test the rm guard pattern**

Create a throwaway directory:
```bash
mkdir -p /tmp/lab2_throwaway/testfiles
touch /tmp/lab2_throwaway/testfiles/file1.txt
touch /tmp/lab2_throwaway/testfiles/file2.txt
ls /tmp/lab2_throwaway/testfiles/
```

Now set an intentionally empty variable and use the guard:
```bash
target_dir=""

[[ -n "$target_dir" ]] || { echo "ERROR: target_dir is empty — aborting delete"; exit 1; }
rm -rf "$target_dir"/testfiles
```

The guard should fire and the error message should print. The files in `/tmp/lab2_throwaway/testfiles/` should still exist. Verify:
```bash
ls /tmp/lab2_throwaway/testfiles/
```

Now set the variable correctly and perform the delete:
```bash
target_dir="/tmp/lab2_throwaway"

[[ -n "$target_dir" ]] || { echo "ERROR: target_dir is empty — aborting delete"; exit 1; }
rm -rf "$target_dir"/testfiles
ls /tmp/lab2_throwaway/
```

The `testfiles/` directory should be gone.

---

**Step 5: Create a symlink**

Create a directory to simulate a versioned log location:
```bash
mkdir -p ~/crashcourse/lab2/logs
touch ~/crashcourse/lab2/logs/reactor-monitor-2026-04-09.log
echo "session started" > ~/crashcourse/lab2/logs/reactor-monitor-2026-04-09.log
```

Create a symlink called `current.log` pointing to today's log file:
```bash
ln -s ~/crashcourse/lab2/logs/reactor-monitor-2026-04-09.log \
      ~/crashcourse/lab2/logs/current.log
```

Verify the symlink:
```bash
ls -la ~/crashcourse/lab2/logs/
```

Read through the symlink:
```bash
cat ~/crashcourse/lab2/logs/current.log
```

Resolve the real path:
```bash
readlink -f ~/crashcourse/lab2/logs/current.log
```

---

**Checkpoint:** Before moving on, confirm:
- [ ] You used `find` with `-type`, `-name`, and `-size` flags
- [ ] You fixed a permission error using `chmod`
- [ ] The rm guard test fired and protected files correctly
- [ ] You created a symlink and read through it

---

### 2.3 Lab 2 Pre-Staged Files (instructor builds these on the VM)

**`/opt/crashcourse/lab2/configs/database.conf`**
```
# PostgreSQL configuration
host=localhost
port=5432
database=reactor_ops
user=ops_user
```
Permissions: set to `644` (readable by all — students will note this is wrong for a credentials file)

**`/opt/crashcourse/lab2/scripts/broken_monitor.sh`**
```bash
#!/bin/bash
set -euo pipefail

logdir=/var/log
echo "Checking logs in: $logdir"
find $logdir -name "*.log" -mtime -1
```
Permissions: set to `644` (not executable — students must fix with chmod)
shellcheck will flag: `$logdir` should be quoted on the find line

**`/opt/crashcourse/lab2/logs/system-2026-04-09.log`**
```
Apr 09 08:00:01 reactor-vm1 systemd[1]: Started Session 1.
Apr 09 08:01:14 reactor-vm1 kernel: EXT4-fs: mounted filesystem
Apr 09 08:05:00 reactor-vm1 sshd[1204]: Accepted publickey for student
```
Size: ensure it is over 1KB (pad with additional log lines as needed)

---

### 2.4 Instructor Notes — Module 2

**Timing:** Lecture 10 min, lab 10 min. The `rm` safety demo is the most important moment — do it live before the lab.

**Live demo (before lecture slides end):**
1. Create `/tmp/demo_danger/` with some files
2. Set `dir=""` (empty)
3. Run `rm -rf $dir/*` (unquoted) — watch it fail or hit current directory
4. Recover. Show the guard pattern. Run it with empty var — guard fires.
5. This takes 3 minutes and students will never forget it.

**What to emphasize:**
- `find` is the right way to locate files. Do not browse manually on production systems.
- Permissions `777` are never acceptable on a nuclear system. `600` for credentials. `750` for scripts.
- The symlink pattern — `current.log` → dated file — is a real production pattern students will encounter.

**Common student mistakes:**
- Using `chmod 777` to "just make it work." Address this directly: that's a security incident.
- Forgetting `-r` on `cp` for directories — they get a confusing error message
- Running `find / -name "*.log"` without restricting the path — this will churn for minutes
- Confusion between relative and absolute paths in `ln -s`. Absolute paths in symlinks are safer and clearer.

**Note on shellcheck in Step 3:** The warning for `$logdir` on the find command may surprise students who think "it's just a path, what could go wrong." Walk through: if logdir contained a space, `find` would interpret it as two arguments. This is the quoting law applied to find.

---

---

## Module 3 — Text Processing & Pipes (20 min)

### 3.1 Slides

---

**Slide 3-1: The Safety Warning**
> "Text processing is where sysadmins extract signal from noise. During an incident, log files are your only source of truth. If you cannot read logs quickly, you are blind."

No single command kills a system in this module — but inability to read logs kills your response time.

---

**Slide 3-2: Reading Files**
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

**Slide 3-3: Searching — grep**
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

**Slide 3-4: Counting, Sorting, Deduplication**
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

**Slide 3-5: Extracting Fields**
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

**Slide 3-6: Stream Editing — sed**
```
sed 's/old/new/' file         — replace first occurrence per line
sed 's/old/new/g' file        — replace all occurrences per line
sed 's/old/new/g' file        — (g = global within line)
sed -i 's/old/new/g' file     — in-place edit (MODIFIES THE FILE)
sed -n '5,10p' file           — print lines 5 through 10
sed '/pattern/d' file         — delete lines matching pattern
```
- `sed -i` modifies the file in place. Always backup first: `cp file file.bak`
- Nuclear rule: never `sed -i` on a production config without a backup

---

**Slide 3-7: Redirection**
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

**Slide 3-8: The Pipe — Composing Tools**
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

### 3.2 Lab Exercise — Lab 3

**Lab 3: Log Analysis with Pipes**
**Time:** 10 minutes
**VM:** vm1

---

**Setup**

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

**Step 1: Inspect the log**

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

**Step 2: Find ERROR lines**

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

**Step 3: Count unique error types**

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

**Step 4: Extract unique IPs**

Many log entries contain IP addresses in the format `192.168.x.x`. Extract all IPs and list them uniquely:
```bash
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' /opt/crashcourse/lab3/sample.log | sort | uniq -c | sort -rn
```

How many unique IPs appear in the log?

---

**Step 5: Extract timestamps of ERROR events**

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

**Step 6: Redirect stdout and stderr**

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

**Checkpoint:** Before moving on, confirm:
- [ ] You found and counted ERROR lines using grep
- [ ] You used awk to extract a specific column
- [ ] You used the `sort | uniq -c | sort -rn` pipeline
- [ ] You redirected stdout and stderr to separate files
- [ ] You extracted unique IPs from the log

---

### 3.3 Lab 3 Sample Log File (instructor generates this)

Generate the sample log file on the VM using this script:

**`/opt/crashcourse/lab3/generate_log.sh`**
```bash
#!/bin/bash
set -euo pipefail

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
```

Run this as root before the session: `sudo bash /opt/crashcourse/lab3/generate_log.sh`

---

### 3.4 Instructor Notes — Module 3

**Timing:** Lecture 10 min, lab 10 min. This module runs fast — `grep` and pipes are familiar to CS students. Spend more time on `awk` and redirection.

**What to emphasize:**
- The `sort | uniq -c | sort -rn` pattern. This is a daily sysadmin tool. Call it the "frequency idiom."
- `tail -f` during a live incident. This is the first command any sysadmin opens.
- The difference between `>` and `>>`. A misplaced `>` has deleted days of log data.
- `2>&1` ordering — if they swap the order they get surprising results. Show this.

**Common student mistakes:**
- Using `cat file | grep "pattern"` instead of `grep "pattern" file`. "Useless use of cat" — explain it wastes a process but isn't wrong.
- `grep` without `-r` on a directory — it errors instead of searching recursively
- Forgetting that `uniq` requires sorted input — show what happens with unsorted input
- `sed -i` without a backup. Drill this: `cp file file.bak` before any `sed -i`
- Using `awk '{print $1}'` when the delimiter isn't whitespace — they need `-F`

**Demo idea:** During the `tail -f` slide, open a second terminal, run `tail -f /var/log/syslog`, then in the first terminal run `logger "TEST MESSAGE FROM STUDENT"`. Students see it appear live. This takes 30 seconds and makes `tail -f` memorable.

---

---

## Module 4 — Process & System Management (25 min)

### 4.1 Slides

---

**Slide 4-1: The Safety Warning**
> "Sending SIGKILL (`kill -9`) to a database process is like pulling the power cable. For PostgreSQL and Oracle: the database will recover on next start via WAL replay — but that takes time and can cause transaction loss. SIGTERM (`kill -15`) lets the database flush and close cleanly. Always try SIGTERM first. Wait. Then escalate."

---

**Slide 4-2: Viewing Processes**
```
ps aux                  — all processes, all users
ps aux | grep postgres  — find postgres processes
pgrep -l postgres       — list PIDs matching name
pgrep -a postgres       — full command line
pidof nginx             — PID of process by name
```
- Output columns for `ps aux`: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
- `STAT` codes: `S`=sleeping, `R`=running, `Z`=zombie, `D`=uninterruptible (I/O wait)

---

**Slide 4-3: Killing Processes — The Right Way**
```
kill -15 PID       — SIGTERM: please stop gracefully (try this first)
kill PID           — same as kill -15
kill -1 PID        — SIGHUP: reload config (many daemons support this)
kill -9 PID        — SIGKILL: force kill (last resort)
pkill -15 name     — SIGTERM by name
pkill -9 name      — SIGKILL by name (DANGEROUS)
killall nginx      — kill all processes named nginx
```
- For databases: SIGTERM first, wait 30 seconds, then escalate
- `kill -9` on a database mid-transaction = potential data corruption

---

**Slide 4-4: System Resource Overview**
```
top                 — live CPU/memory (q to quit)
htop                — better top (F10 to quit)
df -h               — disk space (human-readable)
df -h /             — disk space of root filesystem
du -sh /var/log/    — total size of /var/log
du -sh /var/log/*   — size of each item in /var/log
free -h             — RAM and swap usage
uptime              — load averages (1min, 5min, 15min)
```
- Load average > number of CPU cores = system is overloaded
- `df` shows filesystem level. `du` shows directory level.

---

**Slide 4-5: systemctl — Managing Services**
```
systemctl status servicename        — is it running? last log lines?
systemctl start servicename         — start the service
systemctl stop servicename          — stop the service
systemctl restart servicename       — stop then start
systemctl reload servicename        — reload config without restart
systemctl enable servicename        — start automatically on boot
systemctl disable servicename       — do not start on boot
systemctl is-active servicename     — returns 0 if running, non-zero if not
```
- `systemctl status` is always your first command when a service is unhealthy

---

**Slide 4-6: journalctl — Reading Service Logs**
```
journalctl -u servicename                  — all logs for this service
journalctl -u servicename -n 50            — last 50 lines
journalctl -u servicename -f               — follow live (like tail -f)
journalctl -u servicename --since "1 hour ago"
journalctl -u servicename --since "2026-04-09 08:00" --until "2026-04-09 09:00"
journalctl -p err                          — only error-level messages
journalctl --disk-usage                    — how much disk logs are using
```
- `journalctl` is the authoritative log source for systemd-managed services
- Combine with `grep` via pipe for filtering

---

**Slide 4-7: Network & Port Inspection**
```
ss -tulpn               — listening TCP/UDP ports with PIDs
ss -tulpn | grep :5432  — who is listening on postgres port?
lsof -i :5432           — what process has port 5432 open?
who                     — who is logged in right now
w                       — who, and what they're doing
last                    — login history
```
- `ss -tulpn` flags: t=TCP, u=UDP, l=listening only, p=show process, n=no DNS resolution
- Always check what is listening before opening firewall rules

---

**Slide 4-8: Cron — Scheduled Jobs**
```
crontab -e          — edit your crontab
crontab -l          — list your crontab
crontab -l -u user  — list another user's crontab (root only)

# Cron syntax: minute hour day month weekday command
# *  *  *  *  *   command
# |  |  |  |  |
# |  |  |  |  └── Day of week (0-7, 0 and 7 = Sunday)
# |  |  |  └───── Month (1-12)
# |  |  └──────── Day of month (1-31)
# |  └─────────── Hour (0-23)
# └────────────── Minute (0-59)

# Examples:
*/1 * * * *   /usr/local/bin/disk_check.sh >> /var/log/disk_check.log 2>&1
0 2 * * *     /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
0 */4 * * *   /usr/local/bin/health_check.sh
```
- Always redirect cron output — if you don't, it emails root, which may not be monitored
- Cron runs with a minimal environment — use absolute paths for everything

---

### 4.2 Lab Exercise — Lab 4

**Lab 4: Processes, Services, Ports, and Cron**
**Time:** 15 minutes
**VM:** vm1

---

**Setup**

The instructor has configured a service called `crashcourse-monitor` on your VM. Verify it exists:
```bash
systemctl status crashcourse-monitor
```

---

**Step 1: Find a running process**

List all running processes and find the `sshd` daemon:
```bash
ps aux | grep sshd
```

Note the PID of the sshd parent process (not your grep process).

Use `pgrep` to find it more cleanly:
```bash
pgrep -a sshd
```

---

**Step 2: Check what port a process is listening on**

Find all listening ports on this VM:
```bash
ss -tulpn
```

Find specifically what is listening on port 22 (SSH):
```bash
ss -tulpn | grep :22
```

What process owns port 22? Use lsof to confirm:
```bash
sudo lsof -i :22
```

---

**Step 3: Work with the crashcourse-monitor service**

Check the service status:
```bash
systemctl status crashcourse-monitor
```

Read the last 20 lines of its logs:
```bash
journalctl -u crashcourse-monitor -n 20
```

Stop the service:
```bash
sudo systemctl stop crashcourse-monitor
```

Verify it is stopped:
```bash
systemctl is-active crashcourse-monitor
echo "Exit code: $?"
```

The exit code should be non-zero (service is not active).

Start it again:
```bash
sudo systemctl start crashcourse-monitor
```

Verify it is running:
```bash
systemctl is-active crashcourse-monitor
echo "Exit code: $?"
```

The exit code should be 0.

Read logs from the last 10 minutes to see the stop and start events:
```bash
journalctl -u crashcourse-monitor --since "10 minutes ago"
```

---

**Step 4: Check system resources**

Check disk usage:
```bash
df -h
df -h /
```

Is the root filesystem over 80% full? Record the percentage.

Check how much space `/var/log` is consuming:
```bash
du -sh /var/log/
du -sh /var/log/*
```

Check memory:
```bash
free -h
```

Check system load:
```bash
uptime
```

---

**Step 5: Schedule a cron job**

Create a small disk logging script:
```bash
cat > ~/crashcourse/lab4/disk_logger.sh << 'EOF'
#!/bin/bash
set -euo pipefail
echo "$(date '+%Y-%m-%d %H:%M:%S') $(df -h / | tail -1 | awk '{print $5}')" \
  >> /tmp/disk_usage.log
EOF
chmod +x ~/crashcourse/lab4/disk_logger.sh
```

Test it manually:
```bash
~/crashcourse/lab4/disk_logger.sh
cat /tmp/disk_usage.log
```

Now schedule it to run every minute via cron:
```bash
crontab -e
```

Add this line at the bottom (replace the full path with the actual path from `pwd`):
```
* * * * * /home/student/crashcourse/lab4/disk_logger.sh
```

Save and exit the editor. Confirm the crontab was saved:
```bash
crontab -l
```

Wait two minutes, then check that the log is growing:
```bash
cat /tmp/disk_usage.log
```

You should see two or more timestamped entries.

Remove the cron job when done (edit crontab and delete the line):
```bash
crontab -e
```

---

**Checkpoint:** Before moving on, confirm:
- [ ] You found a process by name using `ps aux | grep` and `pgrep`
- [ ] You identified which port `sshd` is listening on
- [ ] You stopped and started the `crashcourse-monitor` service
- [ ] You used `journalctl` to read logs including the stop/start events
- [ ] You created a cron job and confirmed it ran

---

### 4.3 Crashcourse Monitor Service (instructor sets this up)

**`/etc/systemd/system/crashcourse-monitor.service`**
```ini
[Unit]
Description=Crashcourse Lab Monitor Service
After=network.target

[Service]
Type=simple
User=student
ExecStart=/opt/crashcourse/lab4/monitor_loop.sh
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**`/opt/crashcourse/lab4/monitor_loop.sh`**
```bash
#!/bin/bash
set -euo pipefail

while true; do
  echo "$(date '+%Y-%m-%d %H:%M:%S') crashcourse-monitor: heartbeat OK"
  sleep 30
done
```
```bash
sudo chmod +x /opt/crashcourse/lab4/monitor_loop.sh
sudo systemctl daemon-reload
sudo systemctl enable crashcourse-monitor
sudo systemctl start crashcourse-monitor
```

---

### 4.4 Instructor Notes — Module 4

**Timing:** Lecture 15 min, lab 15 min. This is a 25-minute module total — the SIGKILL safety demo takes 3 minutes and is mandatory.

**What to emphasize:**
- SIGTERM before SIGKILL for any database. This is operational procedure at the nuclear facility.
- `systemctl is-active` returns an exit code — not just text. This is how scripts check service health.
- Cron's minimal environment: absolute paths everywhere in cron jobs, always redirect output.
- Load average: it is not CPU percentage. A load of 4.0 on a 4-core system means the CPU queue is saturated.

**Common student mistakes:**
- Using `kill -9` immediately without trying SIGTERM first
- Reading `systemctl status` but not reading the log lines it shows — those are the most recent journal entries and often explain the failure
- Setting up cron without redirecting stdout/stderr — silent failures
- In cron, using `~/script.sh` instead of `/home/student/script.sh` — the shell in cron does not expand `~`
- Confusing `systemctl restart` (stop then start) with `systemctl reload` (reload config without downtime)

**Demo for SIGKILL:** If a PostgreSQL lab instance is available, demonstrate: start a long transaction, `kill -9` the postgres process, show the recovery log on restart. If Postgres is not available, describe it verbally and show the pg startup log pattern from a saved example.

---

---

## Module 5 — Users, Permissions & Packages (15 min)

### 5.1 Slides

---

**Slide 5-1: The Safety Warning**
> "Principle of least privilege is not a guideline at a nuclear facility — it is a control. Every account has the minimum access to do its job. Granting `sudo` to an account must be documented with a justification. 'I needed to' is not a justification."

---

**Slide 5-2: User Management**
```
useradd -m -s /bin/bash username    — create user with home dir, bash shell
usermod -aG groupname username      — add user to group (append, don't replace)
userdel username                    — delete user (keeps home directory)
userdel -r username                 — delete user AND home directory
passwd username                     — set/change password
id username                         — show UID, GID, groups
groups username                     — list groups for user
```
- `-m` creates the home directory. Forget it and the user has no home.
- `-aG` — the `a` (append) is critical. Without it, `usermod -G` replaces all groups.

---

**Slide 5-3: sudo and su**
```
sudo command                — run command as root
sudo -u username command    — run as specific user
sudo -l                     — list what you can sudo
su - username               — switch to user (full login shell, note the -)
su -                        — switch to root (requires root password)
```
- `su -` vs `su`: the `-` loads the full login environment. Without it you inherit your environment.
- Every `sudo` invocation is logged to `/var/log/auth.log`
- If a command requires `sudo`, ask why. The answer must be documented.

---

**Slide 5-4: Permissions — Numeric Mode**
```
chmod 755 file     — rwxr-xr-x   (scripts, directories)
chmod 644 file     — rw-r--r--   (config files readable by all)
chmod 640 file     — rw-r-----   (config files for a group)
chmod 600 file     — rw-------   (private keys, credential files)
chmod 400 file     — r--------   (read-only backups, archives)
chmod 750 dir/     — rwxr-x---   (directory for owner and group)
```
- The rule for nuclear systems:
  - Credential files: `600` (owner read/write only)
  - Scripts: `750` (owner can run, group can run, others cannot)
  - Config files: `640` (owner rw, group r, no others)
  - Never `777`. If you feel the urge to chmod 777, stop and ask why.

---

**Slide 5-5: umask**
```
umask          — show current umask
umask 022      — set umask (files created with 644, dirs with 755)
umask 027      — tighter (files: 640, dirs: 750)
```
- umask subtracts permissions from the default (files: 666, dirs: 777)
- Set in `/etc/profile` or user's `~/.bashrc` for persistent effect
- Nuclear systems: `027` or tighter as the default umask

---

**Slide 5-6: Package Management**
```
sudo apt update                 — refresh package index (do this first)
sudo apt upgrade                — upgrade all installed packages
sudo apt install packagename    — install a package
sudo apt remove packagename     — remove package (keep config)
sudo apt purge packagename      — remove package and config files
apt search keyword              — search for packages
apt show packagename            — details about a package
dpkg -l | grep packagename      — list installed packages matching name
dpkg -l                         — all installed packages
```
- Always `apt update` before `apt install` — stale index installs old versions
- On production: `apt upgrade` requires a change window and testing. Do not run it casually.

---

### 5.2 Lab Exercise — Lab 5

**Lab 5: Users, Groups, Permissions, and Packages**
**Time:** 10 minutes
**VM:** vm1

---

**Step 1: Create a user**

Create a new user called `ops_agent`:
```bash
sudo useradd -m -s /bin/bash ops_agent
```

Verify the user was created:
```bash
id ops_agent
ls -la /home/ops_agent/
```

---

**Step 2: Create a group and add the user**

Create a group called `ops_team`:
```bash
sudo groupadd ops_team
```

Add `ops_agent` to the group:
```bash
sudo usermod -aG ops_team ops_agent
```

Verify:
```bash
id ops_agent
groups ops_agent
```

You should see `ops_team` in the output.

---

**Step 3: Set correct permissions on a config file**

There is a file at `/opt/crashcourse/lab5/database.conf` with wrong permissions. Check them:
```bash
ls -la /opt/crashcourse/lab5/database.conf
```

The file is currently world-readable (`644`). This is wrong for a database credentials file. Fix it:

First, set ownership to the ops_agent user and ops_team group:
```bash
sudo chown ops_agent:ops_team /opt/crashcourse/lab5/database.conf
```

Then restrict permissions to owner-read/write, group-read, no others:
```bash
sudo chmod 640 /opt/crashcourse/lab5/database.conf
```

Verify:
```bash
ls -la /opt/crashcourse/lab5/database.conf
```

The output should show `-rw-r-----`.

Now make it even more restrictive — owner only (for a private key or password file):
```bash
sudo chmod 600 /opt/crashcourse/lab5/database.conf
ls -la /opt/crashcourse/lab5/database.conf
```

The output should show `-rw-------`.

---

**Step 4: Install packages**

Confirm shellcheck is installed (you've been using it):
```bash
dpkg -l | grep shellcheck
```

Install `htop` if not already present:
```bash
sudo apt update
sudo apt install -y htop
```

Verify installation:
```bash
which htop
htop --version
```

Run htop briefly:
```bash
htop
```
Press `F10` or `q` to exit.

---

**Step 5: Check your own sudo permissions**

List what your account can run with sudo:
```bash
sudo -l
```

Note what is allowed and what is not.

---

**Cleanup:** Remove the test user created in Step 1 (keep the group):
```bash
sudo userdel ops_agent
```

Note: We do NOT use `-r` here because we keep the home directory for audit purposes.

---

**Checkpoint:** Before moving on, confirm:
- [ ] You created a user and verified it with `id`
- [ ] You added the user to a group using `usermod -aG` (with the `a` flag)
- [ ] You changed a file from `644` to `640` then `600`
- [ ] You installed a package using apt

---

### 5.3 Lab 5 Pre-Staged Files

**`/opt/crashcourse/lab5/database.conf`**
```
# Database connection configuration
host=10.0.0.100
port=5432
database=reactor_ops
user=ops_reader
password=CHANGEME_IN_PRODUCTION
```
Permissions: `chmod 644` (intentionally wrong — students must fix)
Ownership: `root:root` (students will chown)

---

### 5.4 Instructor Notes — Module 5

**Timing:** Lecture 8 min, lab 10 min. This is a short module — keep pace. The concepts are familiar from OS courses.

**What to emphasize:**
- The `-a` flag in `usermod -aG`. Without it, the user loses all other group memberships. This is a real production footgun — removing a DBA from the DBA group by accident.
- `600` for anything containing a password. No exceptions.
- The audit trail from `sudo` logging is a real control at nuclear facilities. Every privileged action is logged.

**Common student mistakes:**
- Forgetting `-m` in `useradd` — user is created but has no home directory and cannot log in
- Using `usermod -G` without `-a` and wiping all existing group memberships
- `chmod 777` as the solution to "I can't access this file" — the correct solution is to fix ownership or add the user to the right group
- Running `apt upgrade` in the lab as if it's harmless — on production systems this is a change window event

---

---

## Module 6 — Networking & Remote Operations (15 min)

### 6.1 Slides

---

**Slide 6-1: The Safety Warning**
> "Always `rsync --dry-run` before syncing anything in production. An rsync without `--dry-run` that hits the wrong destination has deleted entire backup trees. The pattern: dry-run, inspect output, remove `--dry-run`, run for real."

---

**Slide 6-2: Network Inspection**
```
ip addr                   — show all network interfaces and IPs
ip addr show eth0         — specific interface
ip route                  — show routing table
ip route show default     — show default gateway
ping -c 4 hostname        — send 4 ICMP packets (test connectivity)
ss -tulpn                 — listening ports with PIDs (Module 4 redux)
```
- `ip addr` replaces the deprecated `ifconfig`
- Know your IPs: `ip addr` is the first command when diagnosing connectivity

---

**Slide 6-3: SSH — Secure Shell**
```
ssh user@hostname           — connect to remote host
ssh -p 2222 user@host       — non-standard port
ssh -i ~/.ssh/keyfile user@host   — use specific private key
ssh -L 5432:localhost:5432 user@host   — port forward (tunnel)
ssh-keygen -t ed25519       — generate keypair
ssh-copy-id user@host       — install your public key on remote host
```
- Key-based auth is required (passwords alone are not acceptable in a nuclear environment)
- Never share private keys. One key per person per system.
- `~/.ssh/authorized_keys` permissions must be `600`

---

**Slide 6-4: Copying Files Remotely**
```
scp file.txt user@host:/remote/path/           — copy file to remote
scp user@host:/remote/path/file.txt ./         — copy from remote
scp -r directory/ user@host:/remote/path/      — copy directory recursively
scp -P 2222 file user@host:/path               — non-standard port
```
- `scp` is for ad-hoc file transfers
- For scripted, production transfers: use `rsync` (resumable, incremental)

---

**Slide 6-5: rsync — The Right Way to Sync**
```
rsync -avz src/ dest/                          — sync local to local
rsync -avz src/ user@host:/remote/dest/        — sync to remote
rsync -avz --dry-run src/ dest/                — DRY RUN (inspect only)
rsync -avz --delete src/ dest/                 — delete files in dest not in src
rsync -avz --exclude "*.tmp" src/ dest/        — exclude patterns
```
- `-a` = archive mode: recursive, preserves permissions/timestamps/symlinks
- `-v` = verbose
- `-z` = compress during transfer
- `--delete` makes dest mirror src exactly. ALWAYS dry-run before using `--delete`.
- Note: trailing slash on `src/` matters. `src/` copies contents. `src` copies the directory itself.

---

**Slide 6-6: HTTP — curl**
```
curl -s https://example.com                       — GET request (silent)
curl -o file.txt https://example.com/file.txt     — download to file
curl -X POST -d '{"key":"value"}' URL             — POST with JSON body
curl -H "Authorization: Bearer TOKEN" URL         — with header
curl -I https://example.com                       — headers only
curl -f https://example.com/health                — fail on HTTP error (exit non-zero)
curl -s --retry 3 --retry-delay 2 URL             — retry with delay
```
- `-f` flag makes curl exit non-zero on 4xx/5xx — critical for scripts
- `-s` silences the progress bar — use in scripts so output is clean

---

**Slide 6-7: Firewall — ufw**
```
sudo ufw status                     — show current rules
sudo ufw status verbose             — more detail
sudo ufw allow 22/tcp               — allow SSH
sudo ufw allow from 10.0.0.0/24    — allow from subnet
sudo ufw deny 3306/tcp              — deny MySQL from outside
sudo ufw enable                     — turn on firewall
sudo ufw disable                    — turn off firewall
```
- Check `ufw status` before `ufw enable` — locking yourself out of SSH is a real mistake
- Nuclear systems: default deny, explicit allow. Every open port is documented and justified.

---

### 6.2 Lab Exercise — Lab 6

**Lab 6: SSH, SCP, rsync, and Port Inspection**
**Time:** 10 minutes
**VMs:** vm1 (your primary) and vm2 (second VM, credentials provided by instructor)

---

**Setup**

The instructor will provide you with:
- The IP address of vm2 (e.g., `192.168.1.X`)
- SSH credentials for vm2 (username and password, or pre-configured key)

Verify you can reach vm2:
```bash
ping -c 2 <vm2-ip>
```

---

**Step 1: SSH into vm2**

```bash
ssh student@<vm2-ip>
```

Once connected, confirm you are on vm2:
```bash
hostname
ip addr
```

You should see a different hostname and IP than your vm1.

Run a couple of commands on vm2:
```bash
uptime
df -h /
```

Exit back to vm1:
```bash
exit
```

---

**Step 2: Copy a file with scp**

On vm1, create a file to transfer:
```bash
echo "Transfer test from vm1 - $(date)" > ~/crashcourse/lab6/transfer_test.txt
```

Copy it to vm2:
```bash
scp ~/crashcourse/lab6/transfer_test.txt student@<vm2-ip>:/tmp/
```

Verify it arrived:
```bash
ssh student@<vm2-ip> "cat /tmp/transfer_test.txt"
```

Now copy a file from vm2 back to vm1:
```bash
scp student@<vm2-ip>:/etc/hostname ~/crashcourse/lab6/vm2_hostname.txt
cat ~/crashcourse/lab6/vm2_hostname.txt
```

---

**Step 3: rsync with dry-run first**

Create a source directory with some files:
```bash
mkdir -p ~/crashcourse/lab6/sync_source
echo "config version 1.0" > ~/crashcourse/lab6/sync_source/app.conf
echo "reactor-id: unit-1" > ~/crashcourse/lab6/sync_source/reactor.conf
echo "temp data" > ~/crashcourse/lab6/sync_source/temp.tmp
```

First, dry-run rsync to vm2:
```bash
rsync -avz --dry-run \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

Read the output carefully. Note which files would be transferred.

Now run for real (remove `--dry-run`):
```bash
rsync -avz \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

Verify on vm2:
```bash
ssh student@<vm2-ip> "ls -la /tmp/sync_dest/"
```

Now add a file on vm1 and sync again. Note that rsync only transfers the new file:
```bash
echo "new data" > ~/crashcourse/lab6/sync_source/new_file.txt
rsync -avz \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

---

**Step 4: Check open ports**

On vm1:
```bash
ss -tulpn
```

Identify:
- What ports are listening on TCP?
- Which port is SSH using?

Use lsof to confirm who owns port 22:
```bash
sudo lsof -i :22
```

Check the firewall status:
```bash
sudo ufw status
```

---

**Checkpoint:** Before moving on, confirm:
- [ ] You SSH'd into vm2 and ran commands there
- [ ] You copied a file with scp in both directions
- [ ] You ran rsync with `--dry-run` first, inspected the output, then ran for real
- [ ] You identified listening ports using `ss -tulpn`

---

### 6.3 Instructor Notes — Module 6

**Timing:** Lecture 8 min, lab 10 min. This module depends on VM2 being properly configured — test SSH access before the session begins.

**Pre-session setup required:**
- vm2 must be running and reachable from vm1
- SSH must be working (password or key-based)
- Create `/tmp/sync_dest/` on vm2 as writable by student user

**What to emphasize:**
- The rsync `--dry-run` discipline. Every single time. Then remove the flag. This is not optional.
- The trailing slash distinction in rsync: `src/` vs `src`. Show both and explain the difference.
- SSH key-based auth is the only acceptable method in production — but for this lab, passwords are fine

**Common student mistakes:**
- Forgetting the trailing slash on rsync source — syncs the directory itself instead of its contents
- Skipping `--dry-run` because "it's just a test VM." Build the habit now.
- `scp -r` forgetting the `-r` when copying directories
- Confusion about which side of the scp command is source vs destination

---

---

## Module 7 — Bash Scripting Essentials (30 min)

### 7.1 Slides

---

**Slide 7-1: The Safety Warning**
> "A script that accepts user input or positional arguments must validate them. `rm -rf "$1"` where `$1` is unvalidated input is a remote code execution / accidental deletion waiting to happen. Validate arguments before using them."

---

**Slide 7-2: Variables and Special Variables**
```bash
name="reactor-1"           # assignment (no spaces around =)
echo "$name"               # always quote
echo "${name}"             # explicit boundary (same thing)
echo "${name:-default}"    # use 'default' if name is unset or empty
echo "${name:?'name required'}"  # exit with error if unset

# Special variables
$0     # script name
$1 $2  # positional arguments
$@     # all arguments as separate words (use this)
$*     # all arguments as one string (avoid this)
$#     # number of arguments
$?     # exit code of last command
$$     # PID of current shell
$!     # PID of last background process
```

---

**Slide 7-3: Parameter Expansion**
```bash
name="reactor-control"

echo "${name^^}"           # REACTOR-CONTROL (uppercase)
echo "${name,,}"           # reactor-control (lowercase)
echo "${#name}"            # 15 (string length)
echo "${name#*-}"          # control (remove up to first -)
echo "${name%-*}"          # reactor (remove from last - to end)
echo "${name/control/monitor}"  # reactor-monitor (replace)
echo "${name:-offline}"    # reactor-control (already set, no change)
unset name
echo "${name:-offline}"    # offline (was unset)
```

---

**Slide 7-4: Command Substitution and Arithmetic**
```bash
# Command substitution
now=$(date +%Y%m%d)
hostname=$(hostname -f)
line_count=$(wc -l < /var/log/syslog)

# Arithmetic — must use $(( ))
count=5
count=$(( count + 1 ))
echo $(( 100 * 3 / 4 ))        # 75 (integer arithmetic)
echo $(( 2 ** 8 ))             # 256

# Bash does NOT do floating point
# For floats: use awk or bc
echo "scale=2; 10/3" | bc      # 3.33
```

---

**Slide 7-5: Conditionals — Always Use [[ ]]**
```bash
# String comparisons
if [[ "$var" == "expected" ]]; then ... fi
if [[ "$var" != "bad" ]]; then ... fi
if [[ -z "$var" ]]; then ... fi       # true if empty
if [[ -n "$var" ]]; then ... fi       # true if non-empty

# Numeric comparisons
if [[ "$count" -gt 10 ]]; then ... fi   # greater than
if [[ "$count" -lt 5 ]]; then ... fi    # less than
if [[ "$count" -eq 0 ]]; then ... fi    # equal
if [[ "$count" -ne 0 ]]; then ... fi    # not equal

# File tests
if [[ -f "$path" ]]; then ... fi
if [[ -d "$dir" ]]; then ... fi
if [[ -x "$script" ]]; then ... fi

# Compound
if [[ "$a" == "x" && "$b" -gt 0 ]]; then ... fi
if [[ "$a" == "x" || "$a" == "y" ]]; then ... fi
```
- Always `[[ ]]`, never `[ ]`. The double bracket is bash-specific and safer.

---

**Slide 7-6: Loops**
```bash
# for loop — files
for file in /var/log/*.log; do
  echo "Processing: $file"
done

# for loop — range
for i in $(seq 1 10); do
  echo "Iteration: $i"
done

# for loop — array
services=("postgres" "nginx" "backup-agent")
for svc in "${services[@]}"; do
  systemctl is-active "$svc" && echo "$svc: UP" || echo "$svc: DOWN"
done

# while loop — wait for condition
attempts=0
while ! systemctl is-active postgres &>/dev/null; do
  echo "Waiting for postgres... (attempt $((++attempts)))"
  sleep 5
  [[ "$attempts" -ge 12 ]] && { echo "Timeout"; exit 1; }
done
echo "postgres is up"
```

---

**Slide 7-7: Functions**
```bash
# Define
log_msg() {
  local level="$1"     # local scope — does not leak out of function
  local msg="$2"
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $msg"
}

# Call
log_msg "INFO" "Service started"
log_msg "ERROR" "Connection failed"

# Function with return code
check_port() {
  local port="$1"
  ss -tulpn | grep -q ":${port} " && return 0 || return 1
}

if check_port 5432; then
  echo "Postgres is listening"
fi
```
- Always use `local` for variables inside functions — prevents leaking into global scope
- Functions can return 0–255 via `return`. For data: use `echo` and capture with `$()`

---

**Slide 7-8: Error Handling and Traps**
```bash
#!/bin/bash
set -euo pipefail

# Trap ERR: runs when any command fails (with set -e)
trap 'echo "ERROR: script failed at line $LINENO — exit code: $?"' ERR

# Trap EXIT: runs when script exits for ANY reason
cleanup() {
  echo "Cleaning up..."
  rm -f /tmp/mylockfile
}
trap cleanup EXIT

# Lockfile pattern (prevent concurrent runs)
lockfile="/tmp/backup.lock"
if [[ -f "$lockfile" ]]; then
  echo "ERROR: another instance is running (lockfile: $lockfile)"
  exit 1
fi
touch "$lockfile"
# cleanup trap will remove it on exit

# Check command results explicitly
pg_dump mydb > /tmp/backup.sql || { echo "Backup failed!"; exit 1; }
```

---

### 7.2 Lab Exercise — Lab 7

**Lab 7: Write a Service Monitor Script**
**Time:** 20 minutes
**VM:** vm1

---

**Objective:** Write a parameterized bash script that accepts a service name as a command-line argument, checks if the service is running, attempts to restart it if not, and logs the result to a file with a timestamp.

**Create your working directory:**
```bash
mkdir -p ~/crashcourse/lab7
cd ~/crashcourse/lab7
```

---

**Step 1: Plan before writing**

Before touching the keyboard, read these requirements:

1. The script takes one argument: the service name (e.g., `./monitor.sh nginx`)
2. If no argument is given, the script prints a usage message and exits with code 1
3. If the service is running, log "SERVICE_NAME: OK" with a timestamp and exit 0
4. If the service is not running, attempt to restart it
5. If the restart succeeds, log "SERVICE_NAME: RESTARTED" and exit 0
6. If the restart fails, log "SERVICE_NAME: FAILED — manual intervention required" and exit 1
7. All log output goes to `/var/log/crashcourse/service_monitor.log`
8. The script must pass shellcheck with no warnings
9. The script must have `set -euo pipefail`

---

**Step 2: Create the log directory**
```bash
sudo mkdir -p /var/log/crashcourse
sudo chown student:student /var/log/crashcourse
chmod 750 /var/log/crashcourse
```

---

**Step 3: Write the script**

```bash
nano ~/crashcourse/lab7/monitor.sh
```

Write the following (type it — do not paste blindly):

```bash
#!/bin/bash
set -euo pipefail

# --- Configuration ---
LOG_FILE="/var/log/crashcourse/service_monitor.log"

# --- Functions ---
log_msg() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "${ts} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

usage() {
  echo "Usage: $0 <service-name>"
  echo "Example: $0 nginx"
  exit 1
}

# --- Argument validation ---
[[ "$#" -eq 1 ]] || usage

SERVICE="$1"

# Validate service name is non-empty and contains only safe characters
[[ -n "$SERVICE" ]] || { echo "ERROR: service name cannot be empty"; exit 1; }
[[ "$SERVICE" =~ ^[a-zA-Z0-9_-]+$ ]] || {
  echo "ERROR: invalid service name: $SERVICE"
  exit 1
}

# --- Main logic ---
if systemctl is-active --quiet "$SERVICE"; then
  log_msg "INFO" "${SERVICE}: OK"
  exit 0
fi

log_msg "WARN" "${SERVICE}: not running — attempting restart"

if sudo systemctl restart "$SERVICE"; then
  log_msg "INFO" "${SERVICE}: RESTARTED successfully"
  exit 0
else
  log_msg "ERROR" "${SERVICE}: FAILED — manual intervention required"
  exit 1
fi
```

Save and exit.

---

**Step 4: Run shellcheck**

```bash
shellcheck ~/crashcourse/lab7/monitor.sh
```

Fix any warnings before continuing. The script must pass with no warnings.

---

**Step 5: Make executable and test**

```bash
chmod +x ~/crashcourse/lab7/monitor.sh
```

Test with no arguments (should print usage):
```bash
./monitor.sh
```

Test with a running service:
```bash
./monitor.sh ssh
```

Check the log file:
```bash
cat /var/log/crashcourse/service_monitor.log
```

Test with a non-existent service (will try and fail to restart):
```bash
./monitor.sh nonexistent-fake-service
echo "Exit code: $?"
```

Check the log again:
```bash
cat /var/log/crashcourse/service_monitor.log
```

---

**Step 6: Test the stopped service path**

Stop the `crashcourse-monitor` service (from Lab 4):
```bash
sudo systemctl stop crashcourse-monitor
```

Run the monitor script against it:
```bash
./monitor.sh crashcourse-monitor
```

The script should detect it is not running, restart it, and log the restart. Verify:
```bash
systemctl is-active crashcourse-monitor
cat /var/log/crashcourse/service_monitor.log
```

---

**Step 7: Add a trap (enhancement)**

Add error trapping to the script. Edit `monitor.sh` and add this line immediately after `set -euo pipefail`:

```bash
trap 'log_msg "ERROR" "Script terminated unexpectedly at line $LINENO"' ERR
```

Note: Because we already handle errors explicitly with `if/else`, this trap mainly catches unexpected failures (e.g., log directory suddenly disappearing). Run shellcheck again after adding it.

---

**Checkpoint:** Before moving on, confirm:
- [ ] The script accepts a service name argument and validates it
- [ ] It exits with code 1 and prints usage if no argument is given
- [ ] It logs with timestamps to the correct file
- [ ] shellcheck passes with no warnings
- [ ] You tested both the "service running" and "service not running" paths
- [ ] You tested with an invalid service name

---

### 7.3 Instructor Notes — Module 7

**Timing:** Lecture 15 min, lab 20 min. This is the longest and most important module in Part 1. The lab produces a real operational script students can keep.

**What to emphasize:**
- `local` variables inside functions. If students do not use `local`, their function variables pollute global scope and cause bugs that are extremely hard to find.
- The argument validation pattern with `=~` regex. Service names that contain `; rm -rf /` should not be executed. Input validation is a security control.
- `tee -a` — writes to both stdout AND appends to the file. This is the correct pattern for scripts that need log files but also need to show output interactively.
- The difference between `set -e` stopping the script and explicit `if/else` error handling. In this script, we want to handle the restart failure gracefully (log and exit 1), not crash abruptly.

**Common student mistakes:**
- Forgetting `local` in functions — variables leak globally
- Using `$1` after modifying `set -- ` arguments — confuses argument position
- Not validating the argument at all: `SERVICE="$1"` without checking `$#` first — crashes with "unbound variable" error from `set -u`
- Using backticks `` `command` `` instead of `$(command)` — both work, but `$()` is modern, nestable, and easier to read. shellcheck prefers `$()`
- Writing the entire script without testing incrementally — for a 30-line script, run shellcheck after every 5 lines in the beginning

**For faster students:** Have them extend the script to accept a list of services as arguments and check each one in a loop.

---

---

## Module 8 — Database Admin Bash (15 min)

### 8.1 Slides

---

**Slide 8-1: The Safety Warning**
> "Never hardcode database credentials in a script. Scripts end up in git repositories. Git repositories end up being accidentally public. Credentials in git are compromised credentials. Store them in environment variables, `.pgpass`, or `.my.cnf` with `600` permissions — and ensure those files are excluded from version control."

---

**Slide 8-2: Credentials — The Right Way**
```bash
# WRONG — never do this
psql -U postgres -p "mysecretpassword" -c "SELECT 1;"

# RIGHT — environment variable
export PGPASSWORD="$PGPASSWORD"   # set externally, not hardcoded
psql -U postgres -c "SELECT 1;"

# RIGHT — .pgpass file (postgres-native)
# ~/.pgpass format: hostname:port:database:username:password
# chmod 600 ~/.pgpass
echo "localhost:5432:*:postgres:$PGPASSWORD" >> ~/.pgpass
chmod 600 ~/.pgpass

# RIGHT — .my.cnf for MySQL
# ~/.my.cnf
# [client]
# user=root
# password=YOURPASS
# chmod 600 ~/.my.cnf
```

---

**Slide 8-3: PostgreSQL Operations**
```bash
# Check version and connectivity
psql -U postgres -c "SELECT version();"

# List databases
psql -U postgres -c "\l"
# or
psql -U postgres -c "SELECT datname FROM pg_database;"

# Count active connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -U postgres -c "
  SELECT pid, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND query_start IS NOT NULL
  ORDER BY duration DESC LIMIT 10;"

# Backup
pg_dump -U postgres mydb > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore
psql -U postgres -d mydb < backup.sql
```

---

**Slide 8-4: MySQL/MariaDB Operations**
```bash
# Check connectivity (credentials in .my.cnf)
mysql -e "SELECT version();"
mysql -e "SHOW DATABASES;"

# Backup
mysqldump mydb > "backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore
mysql mydb < backup.sql

# Check process list
mysql -e "SHOW PROCESSLIST;"

# Check running connections
mysql -e "SHOW STATUS LIKE 'Threads_connected';"
```

---

**Slide 8-5: Oracle (sqlplus)**
```bash
# Connect and run query
sqlplus -s user/"$ORACLE_PASS"@//host:1521/ORCL <<EOF
SET PAGESIZE 0 FEEDBACK OFF VERIFY OFF HEADING OFF ECHO OFF;
SELECT status FROM v\$instance;
EXIT;
EOF

# Check exit code
status=$(sqlplus -s ... <<EOF
...
EOF
)
[[ $? -eq 0 ]] || { echo "Oracle query failed"; exit 1; }

# Data pump export
expdp user/"$ORACLE_PASS" \
  DIRECTORY=DATA_PUMP_DIR \
  DUMPFILE="export_$(date +%Y%m%d).dmp" \
  LOGFILE="export_$(date +%Y%m%d).log"
```

---

**Slide 8-6: The Health Check Pattern**
```bash
#!/bin/bash
set -euo pipefail

THRESHOLD=50   # max acceptable connections
DB_USER="postgres"

conn_count=$(psql -U "$DB_USER" -t -c "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')

if [[ "$conn_count" -gt "$THRESHOLD" ]]; then
  echo "ALERT: $conn_count active connections (threshold: $THRESHOLD)"
  exit 1
fi

echo "OK: $conn_count active connections"
exit 0
```
- `-t` flag: tuples only (no headers, no row count) — machine-readable output
- `tr -d ' '` strips whitespace from psql output
- Exit code convention: `0` = healthy, `1` = alert. Monitoring systems depend on this.

---

**Slide 8-7: Backup Best Practices**
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/postgres"
DB_NAME="reactor_ops"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Ensure backup dir exists
[[ -d "$BACKUP_DIR" ]] || mkdir -p "$BACKUP_DIR"

# Backup
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" \
  || { echo "ERROR: pg_dump failed"; exit 1; }

# Verify backup is non-empty
[[ -s "$BACKUP_FILE" ]] \
  || { echo "ERROR: backup file is empty"; rm -f "$BACKUP_FILE"; exit 1; }

echo "Backup completed: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql" -mtime +${RETENTION_DAYS} -delete
echo "Pruned backups older than $RETENTION_DAYS days"
```

---

### 8.2 Lab Exercise — Lab 8

**Lab 8: Database Health Check Script**
**Time:** 10 minutes
**VM:** vm1 (with PostgreSQL running — instructor pre-configured)

---

**Objective:** Write a script that connects to PostgreSQL, counts active connections, and exits non-zero with an alert message if the count exceeds a configurable threshold.

**Pre-check — verify PostgreSQL is running:**
```bash
systemctl is-active postgresql
psql -U postgres -c "SELECT version();" 2>/dev/null || echo "NOTE: Need sudo -u postgres"
```

If you get a permission error, use:
```bash
sudo -u postgres psql -c "SELECT version();"
```

Note which invocation works on your VM — use that form in your script.

---

**Step 1: Explore the database first**

Run these queries to understand what you'll be monitoring:
```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity;"
sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datistemplate = false;"
```

Note the difference between the output of the first and second command. The `-t` flag removes headers — this is what you need for scripting.

---

**Step 2: Write the health check script**

```bash
mkdir -p ~/crashcourse/lab8
nano ~/crashcourse/lab8/pg_health.sh
```

Write the following:

```bash
#!/bin/bash
set -euo pipefail

# --- Configuration ---
DB_USER="postgres"
THRESHOLD="${PG_CONN_THRESHOLD:-20}"   # default 20; override via env var
LOG_FILE="/var/log/crashcourse/pg_health.log"

# --- Functions ---
log_msg() {
  local level="$1"
  local msg="$2"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "${ts} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

# --- Check PostgreSQL is reachable ---
if ! sudo -u "$DB_USER" psql -c "SELECT 1;" &>/dev/null; then
  log_msg "ERROR" "Cannot connect to PostgreSQL"
  exit 1
fi

# --- Count active connections ---
conn_count=$(sudo -u "$DB_USER" psql -t -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" \
  | tr -d ' \n')

# Validate the result is numeric
[[ "$conn_count" =~ ^[0-9]+$ ]] || {
  log_msg "ERROR" "Unexpected output from pg_stat_activity: '$conn_count'"
  exit 1
}

# --- Evaluate threshold ---
if [[ "$conn_count" -gt "$THRESHOLD" ]]; then
  log_msg "WARN" "Active connections: ${conn_count} (threshold: ${THRESHOLD}) — ALERT"
  exit 1
fi

log_msg "INFO" "Active connections: ${conn_count} (threshold: ${THRESHOLD}) — OK"
exit 0
```

Save and exit.

---

**Step 3: shellcheck and test**

```bash
shellcheck ~/crashcourse/lab8/pg_health.sh
chmod +x ~/crashcourse/lab8/pg_health.sh
```

Run with default threshold:
```bash
~/crashcourse/lab8/pg_health.sh
echo "Exit code: $?"
```

Run with a very low threshold to trigger the alert:
```bash
PG_CONN_THRESHOLD=0 ~/crashcourse/lab8/pg_health.sh
echo "Exit code: $?"
```

Check the log file:
```bash
cat /var/log/crashcourse/pg_health.log
```

---

**Step 4: Make it schedulable via cron**

Add the health check to cron to run every 5 minutes:
```bash
crontab -e
```

Add:
```
*/5 * * * * /home/student/crashcourse/lab8/pg_health.sh >> /var/log/crashcourse/pg_health.log 2>&1
```

Note: the script already logs internally — but the cron redirect here captures any unexpected stderr that bypasses the log function.

Remove the cron entry after confirming it works (it will log every 5 minutes during Part 2):
```bash
crontab -e
```

---

**Checkpoint:** Before moving on, confirm:
- [ ] You can connect to PostgreSQL and retrieve the active connection count
- [ ] The script exits 0 when connections are below threshold
- [ ] The script exits 1 when connections exceed threshold
- [ ] shellcheck passes with no warnings
- [ ] The log file shows timestamped output from multiple runs

---

### 8.3 Instructor Notes — Module 8

**Timing:** Lecture 10 min, lab 10 min. This is the final module — energy may be low. Keep demos tight and focus on the patterns.

**Pre-session setup required:**
- PostgreSQL must be running: `sudo systemctl start postgresql`
- The `postgres` system user must be able to run `psql` without password (default on Ubuntu)
- Ensure `/var/log/crashcourse/` exists with student write permissions (from Lab 7)

**What to emphasize:**
- The `-t` flag for machine-readable psql output. This is the most important psql flag for scripting.
- The credential storage pattern: environment variables and `.pgpass`. Show students the `.pgpass` file format. Let them know every database credential they ever handle in scripts should use this pattern.
- Exit code conventions for health checks: 0=OK, 1=warning/critical. Monitoring systems (Nagios, Zabbix, custom) all follow this convention.

**Common student mistakes:**
- Not stripping whitespace from psql output — the comparison `"$conn_count" -gt 20` fails because `conn_count` has leading/trailing spaces
- Hardcoding the postgres user password in the script — address this directly
- Not checking if PostgreSQL is reachable before querying it — if the DB is down, the script should say "cannot connect" not crash with a confusing error
- Using `$()` to capture psql output that includes both the result AND a trailing empty line — the `tr -d ' \n'` strips it

**For faster students:** Have them add a check for long-running queries (over 60 seconds) and report those as a separate exit code or log line.

---

---

## Implementation Build Order

Build the following artifacts in this sequence. Steps that are independent can be built in parallel.

---

### Step 1: VM Provisioning (prerequisite — complete before anything else)

**vm1 (primary student VM):**
- Ubuntu 22.04 LTS
- Installed packages: `bash shellcheck nano htop curl rsync openssh-server postgresql ufw`
- User: `student` with sudo rights (for specific commands: systemctl, apt, useradd, etc.)
- PostgreSQL running on default port 5432

**vm2 (secondary VM, one per student pair or per student):**
- Ubuntu 22.04 LTS
- Installed packages: `bash openssh-server`
- User: `student` with SSH access from vm1
- `/tmp/sync_dest/` writable by student

**Verify before session:**
```bash
# Run on vm1
shellcheck --version
psql --version
systemctl is-active postgresql
ssh student@<vm2-ip> "hostname"
```

---

### Step 2: Lab Staging Script (run on vm1 before students arrive)

Create all pre-staged directories and files in one pass:

**`/opt/crashcourse/setup_labs.sh`** — run as root:

```bash
#!/bin/bash
set -euo pipefail

echo "Setting up crashcourse lab environment..."

# Lab 2 — Navigation & File Operations
mkdir -p /opt/crashcourse/lab2/{configs,logs,scripts,data}

cat > /opt/crashcourse/lab2/configs/database.conf << 'EOF'
# PostgreSQL configuration
host=localhost
port=5432
database=reactor_ops
user=ops_user
EOF
chmod 644 /opt/crashcourse/lab2/configs/database.conf

cat > /opt/crashcourse/lab2/scripts/broken_monitor.sh << 'EOF'
#!/bin/bash
set -euo pipefail

logdir=/var/log
echo "Checking logs in: $logdir"
find $logdir -name "*.log" -mtime -1
EOF
chmod 644 /opt/crashcourse/lab2/scripts/broken_monitor.sh   # intentionally not executable

# Pad log file to over 1KB
for i in $(seq 1 60); do
  echo "Apr 09 08:0${i:0:1}:01 reactor-vm1 systemd[1]: Session $i log entry padding line" \
    >> /opt/crashcourse/lab2/logs/system-2026-04-09.log
done

# Lab 3 — Text Processing
mkdir -p /opt/crashcourse/lab3
bash /opt/crashcourse/lab3/generate_log.sh 2>/dev/null || true

# Lab 4 — Process & System Management
mkdir -p /opt/crashcourse/lab4

cat > /opt/crashcourse/lab4/monitor_loop.sh << 'EOF'
#!/bin/bash
set -euo pipefail
while true; do
  echo "$(date '+%Y-%m-%d %H:%M:%S') crashcourse-monitor: heartbeat OK"
  sleep 30
done
EOF
chmod +x /opt/crashcourse/lab4/monitor_loop.sh

cat > /etc/systemd/system/crashcourse-monitor.service << 'EOF'
[Unit]
Description=Crashcourse Lab Monitor Service
After=network.target

[Service]
Type=simple
User=student
ExecStart=/opt/crashcourse/lab4/monitor_loop.sh
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable crashcourse-monitor
systemctl start crashcourse-monitor

# Lab 5 — Users, Permissions & Packages
mkdir -p /opt/crashcourse/lab5

cat > /opt/crashcourse/lab5/database.conf << 'EOF'
# Database connection configuration
host=10.0.0.100
port=5432
database=reactor_ops
user=ops_reader
password=CHANGEME_IN_PRODUCTION
EOF
chmod 644 /opt/crashcourse/lab5/database.conf   # intentionally too permissive

# Log directory for labs 7 and 8
mkdir -p /var/log/crashcourse
chown student:student /var/log/crashcourse
chmod 750 /var/log/crashcourse

echo "Lab setup complete."
systemctl status crashcourse-monitor --no-pager
```

---

### Step 3: Build Slides (after VM setup, before session)

Create one slide deck covering all 8 modules. Recommended format: Markdown with marp, or a PDF from the content in this document. Slide count targets:

| Module | Slides | Notes |
|---|---|---|
| 1 | 8 | Include the shebang/set -euo pipefail on first real slide, large font |
| 2 | 8 | Include a live demo of the rm guard — do not skip |
| 3 | 8 | The pipe examples on 3-8 should be readable — use a dark theme |
| 4 | 8 | Cron syntax slide — leave it up during the cron part of Lab 4 |
| 5 | 6 | Short module — keep moving |
| 6 | 7 | rsync trailing slash gotcha — put it in red |
| 7 | 8 | Parameter expansion slide (7-3) — students will reference this later |
| 8 | 7 | Credential storage pattern (8-2) — most important slide of module 8 |

---

### Step 4: Build Lab 3 Log Generator and Run It

The log generator script must be created and run before students arrive so `/opt/crashcourse/lab3/sample.log` exists. See the generator script in section 3.3. Verify after running:
```bash
wc -l /opt/crashcourse/lab3/sample.log   # should be ~500
grep -c "ERROR" /opt/crashcourse/lab3/sample.log   # should be non-zero
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' /opt/crashcourse/lab3/sample.log | sort -u  # should show IPs
```

---

### Step 5: Prepare Instructor Cheat Sheet (reference during delivery)

One-page reference per module with:
- The "kill command to know" for each lab (e.g., `Ctrl+C`, `q`, `F10`, `:q`)
- Time checks: "If you are here at the 45-minute mark, you are on pace"
- Recovery commands if a student's VM gets broken

**Timing guide:**
```
00:00  Module 1 starts
00:20  Lab 1 complete — Module 2 starts
00:40  Lab 2 complete — Module 3 starts
01:00  Lab 3 complete — Module 4 starts
01:25  Lab 4 complete — Module 5 starts
01:40  Lab 5 complete — Module 6 starts
01:55  Lab 6 complete — Module 7 starts
02:25  Lab 7 complete — Module 8 starts
02:40  Lab 8 complete — Part 1 ends
02:45  5-minute buffer / questions before Part 2
```

---

### Step 6: Student Reference Card

Print and distribute before Part 1 begins. Content:

**Front side — Commands quick reference** (all commands from Modules 1–6)
**Back side — Scripting patterns** (Modules 7–8: the standard header, the trap pattern, the health check pattern, the backup pattern, the log_msg function)

This card stays with students and is referenced during Part 2 exercises.

---

### Step 7: VM Recovery Procedure (instructor reference)

If a student's vm1 gets broken during labs:

1. **Broken script in infinite loop:** `Ctrl+C` first, then `kill -9 $(pgrep -f scriptname)`
2. **Filesystem permissions broken:** `sudo chmod -R 755 /opt/crashcourse` to reset
3. **crashcourse-monitor not starting:** `sudo journalctl -u crashcourse-monitor -n 20` to diagnose
4. **Cron filling up disk:** `crontab -l`, identify runaway jobs, `crontab -e` to remove them, check `df -h`
5. **Student locked out of VM:** SSH from instructor machine using root key

---

## Dependency Map

```
VM Provisioning
    └── setup_labs.sh (generates lab2, lab3, lab4, lab5 content, installs service)
        ├── Lab 1 (no lab content deps — students create everything)
        ├── Lab 2 (depends on lab2 directory tree)
        ├── Lab 3 (depends on sample.log from generate_log.sh)
        ├── Lab 4 (depends on crashcourse-monitor service)
        ├── Lab 5 (depends on lab5/database.conf)
        ├── Lab 6 (depends on vm2 being reachable)
        ├── Lab 7 (depends on /var/log/crashcourse existing — created in setup_labs.sh)
        └── Lab 8 (depends on PostgreSQL running + /var/log/crashcourse existing)

Slides
    └── Independent — build any time after design is finalized

Student Reference Card
    └── Depends on slides being finalized (pull command summaries from slides)
```

---

## Acceptance Criteria — Part 1 Is Ready When

- [ ] Both VMs boot and are reachable
- [ ] `shellcheck` is installed and runs on vm1
- [ ] `setup_labs.sh` runs without errors on vm1
- [ ] `systemctl status crashcourse-monitor` shows active/running
- [ ] `psql -U postgres -c "SELECT 1;"` works (via `sudo -u postgres`)
- [ ] SSH from vm1 to vm2 works as student user
- [ ] All 8 lab exercises have been dry-run by the instructor end-to-end
- [ ] The slide deck covers all 8 modules with the safety warning on slide 1 of each
- [ ] The student reference card is printed (one per student)
- [ ] The instructor has the VM recovery procedure available offline

---
*Plan version: 1.0 | 2026-04-09*

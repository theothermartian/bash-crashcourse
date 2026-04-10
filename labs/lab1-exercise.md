# Lab 1: Your First Script and Shellcheck

**Module:** 1 — Bash Fundamentals & The Nuclear Mindset
**Time:** 10 minutes
**VM:** vm1 (your primary VM)

---

## Setup

Open a terminal on your VM. Confirm your working directory:
```bash
pwd
```
You should see your home directory, e.g. `/home/student`.

Create a directory for today's exercises:
```bash
mkdir -p ~/crashcourse/lab1
cd ~/crashcourse/lab1
```

---

## Step 1: Write the script

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

## Step 2: Run shellcheck

```bash
shellcheck hello.sh
```

Expected output: no warnings. If you see warnings, read them carefully and fix the script before continuing.

---

## Step 3: Make it executable and run it

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

## Step 4: Introduce a quoting bug — watch shellcheck catch it

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

## Step 5: Check exit codes

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

## Checkpoint

Before moving on, confirm:
- [ ] `hello.sh` runs without errors
- [ ] `shellcheck hello.sh` produces no warnings
- [ ] You have seen and understand what an exit code looks like
- [ ] You understand why the quoting warning appeared

# Lab 2: Navigation, Find, Permissions, Symlinks

**Module:** 2 — Navigation & File Operations
**Time:** 10 minutes
**VM:** vm1

---

## Setup

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

## Step 1: Navigate and observe

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

## Step 2: Find files by extension

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

## Step 3: Fix a broken script

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

## Step 4: Test the rm guard pattern

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

## Step 5: Create a symlink

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

## Checkpoint

Before moving on, confirm:
- [ ] You used `find` with `-type`, `-name`, and `-size` flags
- [ ] You fixed a permission error using `chmod`
- [ ] The rm guard test fired and protected files correctly
- [ ] You created a symlink and read through it

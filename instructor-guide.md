# Instructor Guide — Bash Crashcourse Part 1

**Audience:** CS-background students becoming sysadmins/DBAs at a nuclear facility
**Duration:** ~3 hours (8 modules + labs)
**Environment:** Ubuntu 22.04, two VMs per student

---

## Timing Guide

```
00:00  Module 1 starts   — Bash Fundamentals & The Nuclear Mindset
00:20  Lab 1 complete    — Module 2 starts
00:40  Lab 2 complete    — Module 3 starts
01:00  Lab 3 complete    — Module 4 starts
01:25  Lab 4 complete    — Module 5 starts
01:40  Lab 5 complete    — Module 6 starts
01:55  Lab 6 complete    — Module 7 starts
02:25  Lab 7 complete    — Module 8 starts
02:40  Lab 8 complete    — Part 1 ends
02:45  5-minute buffer / questions before Part 2
```

**If you are running late:** Module 5 (Users & Permissions) and Module 6 (Networking) are the most compressible. Module 7 (Scripting) and Module 8 (DB Admin) must run at full length.

---

## Pre-Session Checklist

Run on vm1 before students arrive:

```bash
# 1. Copy generate_log.sh to vm1 and run it
sudo cp generate_log.sh /opt/crashcourse/lab3/generate_log.sh
sudo bash /opt/crashcourse/lab3/generate_log.sh

# 2. Run the lab setup script
sudo bash setup_labs.sh

# 3. Verify everything
shellcheck --version
psql --version
systemctl is-active postgresql
systemctl is-active crashcourse-monitor
ssh student@<vm2-ip> "hostname"
wc -l /opt/crashcourse/lab3/sample.log   # should be ~500
grep -c "ERROR" /opt/crashcourse/lab3/sample.log   # should be > 0
```

---

## Module-by-Module Notes

### Module 1 — Bash Fundamentals (20 min)

**Key demo:** Type `x = 1` (note the spaces) — show the error. Then `x=1; echo $x`. Contrast lands instantly.

**Must say out loud:** "Every script in this room runs against a real Ubuntu VM. It is not sandboxed. A bad command will break your VM. That is acceptable here — it is not acceptable in production. Treat every exercise like production anyway."

**Watch for:** Students disabling `set -e` to "make debugging easier." This is a procedural violation in a nuclear environment. Address it immediately if you see it.

**Kill command to know:** `nano` — `Ctrl+X` to exit, `Ctrl+O` to save

---

### Module 2 — Navigation & File Operations (20 min)

**Mandatory live demo (3 min):**
1. `mkdir -p /tmp/demo_danger && touch /tmp/demo_danger/file1 /tmp/demo_danger/file2`
2. `dir=""`
3. `rm -rf $dir/*` (unquoted, with empty dir)
4. Show what happened. Recover.
5. Show the guard: `[[ -n "$dir" ]] || { echo "ERROR: dir is empty"; exit 1; }; rm -rf "$dir"/*`
6. Run with empty `dir` — guard fires.

Students will never forget this.

**Kill command to know:** `less` — `q` to quit, `/pattern` to search, `n` for next match

---

### Module 3 — Text Processing & Pipes (20 min)

**Demo for tail -f (30 seconds, very effective):**
- Terminal 1: `tail -f /var/log/syslog`
- Terminal 2: `logger "TEST MESSAGE FROM STUDENT"`
- Students see it appear live.

**Most important idiom:** `sort | uniq -c | sort -rn` — call it the "frequency idiom." Students will use it daily.

**Kill command to know:** `less` — `q`. Also `Ctrl+C` to interrupt running commands.

---

### Module 4 — Process & System Management (25 min)

**SIGKILL demo:** If PostgreSQL is available:
1. Open a psql session and start a long transaction (`BEGIN; SELECT pg_sleep(300);`)
2. Find the PID: `pgrep -a postgres`
3. `sudo kill -9 <pid>` — show the crash
4. Watch it recover via WAL replay on restart
5. Point: "This is why we use kill -15 first and wait."

If Postgres is not available, show the WAL recovery log lines from `shared/incident.log` and walk through what they mean.

**Timing note:** Cron lab (Step 5) requires 2 minutes of waiting. Tell students to move to the resource checks (Step 4) first, set up cron, then come back.

**Kill commands to know:** `top` — `q`. `htop` — `F10` or `q`. `crontab -e` — depends on editor (`Ctrl+X` for nano, `:wq` for vim)

---

### Module 5 — Users, Permissions & Packages (15 min)

**Emphasize the `-a` flag story:** "I have personally seen a DBA removed from the DBA group because someone ran `usermod -G dba` without `-a` while adding them to a second group. They couldn't access the database. The system was down for 20 minutes while we figured out why."

**Permissions on a nuclear system:**
- `600` for anything with credentials. No exceptions.
- `750` for scripts. `640` for configs. Never `777`.

---

### Module 6 — Networking & Remote Operations (15 min)

**Pre-session:** Verify vm2 is reachable and SSH works before students arrive. If vm2 fails during the lab, students can do Steps 1-2 using vm1's loopback (use `127.0.0.1` as vm2) for reduced functionality.

**rsync trailing slash:** Show live: `rsync -avz --dry-run ~/testdir/ /tmp/dest/` (syncs contents) vs `rsync -avz --dry-run ~/testdir /tmp/dest/` (syncs the directory itself). Students will encounter this in production.

---

### Module 7 — Bash Scripting Essentials (30 min)

**This module produces a real script.** Students should leave with `monitor.sh` ready to use.

**Walk the room during the lab.** Watch for:
- Missing `local` in function variables
- Skipping argument validation
- Not running shellcheck after every edit

**For fast finishers:** "Extend the script to accept multiple service names: `./monitor.sh nginx postgres backup-agent`"

---

### Module 8 — Database Admin Bash (15 min)

**Final module energy:** Students may be tired. Keep the lecture tight. The lab script is straightforward if Module 7 landed.

**PostgreSQL must be running.** Verify: `sudo systemctl is-active postgresql`. If it's not, `sudo systemctl start postgresql`.

**The credential lecture:** Show a real git repository leak story. "In 2022, Twitch leaked credentials that were hardcoded in internal scripts. You are working on nuclear infrastructure. The consequences are higher."

---

## Common Problems & Recovery

### Student's script is in an infinite loop
```bash
# Ctrl+C first
# If that fails:
kill -15 $(pgrep -f scriptname)
# If that fails:
kill -9 $(pgrep -f scriptname)
```

### Filesystem permissions broken
```bash
sudo chmod -R 755 /opt/crashcourse
sudo chown -R root:root /opt/crashcourse
```

### crashcourse-monitor not starting
```bash
sudo journalctl -u crashcourse-monitor -n 20
sudo systemctl status crashcourse-monitor
# If broken: re-run setup_labs.sh
```

### Cron job filling up disk
```bash
crontab -l          # identify the runaway job
crontab -e          # remove it
df -h               # check disk
du -sh /tmp/*       # find what's large
```

### Student locked out of their VM
SSH from the instructor machine using the root key.

### PostgreSQL won't start (Lab 8)
```bash
sudo journalctl -u postgresql -n 30
sudo systemctl restart postgresql
# If data directory corrupted: sudo pg_ctlcluster 14 main start
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
- [ ] This instructor guide is available offline

# VM Recovery Procedure — Instructor Reference

Keep this document available offline during the session.

---

## Problem: Student script is in an infinite loop

```bash
# Step 1: Try Ctrl+C in the terminal where the script is running

# Step 2: If Ctrl+C doesn't work, find and kill the process
ps aux | grep scriptname
kill -15 <PID>

# Step 3: If SIGTERM doesn't stop it within 10 seconds
kill -9 <PID>

# Using pgrep (faster)
kill -15 $(pgrep -f scriptname)
# then if needed:
kill -9 $(pgrep -f scriptname)
```

---

## Problem: Filesystem permissions broken on /opt/crashcourse

Student accidentally ran chmod on the lab tree:
```bash
sudo chmod -R 755 /opt/crashcourse
sudo chown -R root:root /opt/crashcourse
# Re-apply intentional quirks for labs:
sudo chmod 644 /opt/crashcourse/lab2/scripts/broken_monitor.sh   # intentionally not executable
sudo chmod 644 /opt/crashcourse/lab2/configs/database.conf
sudo chmod 644 /opt/crashcourse/lab5/database.conf
```

---

## Problem: crashcourse-monitor service not running

```bash
# Diagnose
sudo journalctl -u crashcourse-monitor -n 30
sudo systemctl status crashcourse-monitor

# Quick fix
sudo systemctl restart crashcourse-monitor

# If the service file is corrupted — re-run setup_labs.sh
sudo bash /opt/crashcourse/setup_labs.sh
```

---

## Problem: Cron job is filling up disk

Student created a runaway cron job that is writing too much:
```bash
# See all cron jobs for this user
crontab -l

# Edit and remove the runaway job
crontab -e

# Check disk
df -h

# Find what's large
du -sh /tmp/*
du -sh /var/log/crashcourse/*
du -sh ~/crashcourse/*

# Remove if safe
rm -f /tmp/disk_usage.log   # from Lab 4 disk_logger test
```

---

## Problem: Student locked out of VM

SSH from the instructor machine using the root key:
```bash
ssh -i /path/to/instructor-root-key root@<student-vm-ip>
```

---

## Problem: PostgreSQL won't start (Lab 8)

```bash
# Check what's wrong
sudo journalctl -u postgresql -n 50
sudo systemctl status postgresql

# Try restarting
sudo systemctl restart postgresql

# If data directory issue
sudo -u postgres pg_lsclusters
sudo pg_ctlcluster 14 main start    # adjust version as needed

# If port conflict (another process on 5432)
ss -tulpn | grep :5432
sudo kill -15 <conflicting-PID>
sudo systemctl start postgresql
```

---

## Problem: /var/log/crashcourse doesn't exist (Labs 7 & 8)

setup_labs.sh should have created this. If it's missing:
```bash
sudo mkdir -p /var/log/crashcourse
sudo chown student:student /var/log/crashcourse
sudo chmod 750 /var/log/crashcourse
```

---

## Problem: SSH from vm1 to vm2 fails (Lab 6)

```bash
# Check vm2 is up
ping -c 2 <vm2-ip>

# Check SSH is running on vm2
ssh root@<vm2-ip> "systemctl is-active sshd"

# Check firewall on vm2
ssh root@<vm2-ip> "ufw status"

# Fallback for Lab 6 if vm2 is completely unavailable:
# Students use 127.0.0.1 as "vm2" — SSH to localhost works for the exercise
# but rsync to vm2 won't demonstrate the remote aspect
```

---

## Emergency: Student's VM is unrecoverable

If a student's vm1 is too broken to continue:
1. Provision a fresh vm1 snapshot (should take < 5 minutes)
2. Run setup_labs.sh on the fresh VM
3. Student loses their Lab 1-N progress but can continue from current module
4. Reassure them: "This is why we have snapshots in production"

---

## VM Provisioning Reference (for fresh setups)

**vm1 required packages:**
```bash
sudo apt update
sudo apt install -y bash shellcheck nano htop curl rsync openssh-server postgresql ufw
```

**vm2 required packages:**
```bash
sudo apt install -y bash openssh-server
```

**vm2 setup:**
```bash
# On vm2, allow student SSH
mkdir -p /tmp/sync_dest
chown student:student /tmp/sync_dest
```

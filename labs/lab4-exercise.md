# Lab 4: Processes, Services, Ports, and Cron

**Module:** 4 — Process & System Management
**Time:** 15 minutes
**VM:** vm1

---

## Setup

The instructor has configured a service called `crashcourse-monitor` on your VM. Verify it exists:
```bash
systemctl status crashcourse-monitor
```

---

## Step 1: Find a running process

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

## Step 2: Check what port a process is listening on

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

## Step 3: Work with the crashcourse-monitor service

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

## Step 4: Check system resources

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

## Step 5: Schedule a cron job

Create a small disk logging script:
```bash
mkdir -p ~/crashcourse/lab4
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

## Checkpoint

Before moving on, confirm:
- [ ] You found a process by name using `ps aux | grep` and `pgrep`
- [ ] You identified which port `sshd` is listening on
- [ ] You stopped and started the `crashcourse-monitor` service
- [ ] You used `journalctl` to read logs including the stop/start events
- [ ] You created a cron job and confirmed it ran

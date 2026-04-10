# Module 4 — Process & System Management
**Duration:** 25 min (15 min lecture + 15 min Lab 4)

---

## Slide 4-1: The Safety Warning

> "Sending SIGKILL (`kill -9`) to a database process is like pulling the power cable. For PostgreSQL and Oracle: the database will recover on next start via WAL replay — but that takes time and can cause transaction loss. SIGTERM (`kill -15`) lets the database flush and close cleanly. Always try SIGTERM first. Wait. Then escalate."

---

## Slide 4-2: Viewing Processes

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

## Slide 4-3: Killing Processes — The Right Way

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

## Slide 4-4: System Resource Overview

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

## Slide 4-5: systemctl — Managing Services

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

## Slide 4-6: journalctl — Reading Service Logs

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

## Slide 4-7: Network & Port Inspection

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

## Slide 4-8: Cron — Scheduled Jobs

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

## Instructor Notes

**Timing:** 15 min lecture, 15 min lab. Total = 25 min. The SIGKILL safety demo takes 3 minutes and is mandatory.

**What to emphasize:**
- SIGTERM before SIGKILL for any database. This is operational procedure at the nuclear facility.
- `systemctl is-active` returns an exit code — not just text. This is how scripts check service health.
- Cron's minimal environment: absolute paths everywhere in cron jobs, always redirect output.
- Load average: it is not CPU percentage. A load of 4.0 on a 4-core system means the CPU queue is saturated.

**Demo for SIGKILL:** If a PostgreSQL lab instance is available, demonstrate: start a long transaction, `kill -9` the postgres process, show the recovery log on restart. If Postgres is not available, describe it verbally and show the pg startup log pattern from a saved example.

**Common student mistakes:**
- Using `kill -9` immediately without trying SIGTERM first
- Reading `systemctl status` but not reading the log lines it shows
- Setting up cron without redirecting stdout/stderr — silent failures
- In cron, using `~/script.sh` instead of `/home/student/script.sh` — `~` is not expanded in cron
- Confusing `systemctl restart` (stop then start) with `systemctl reload` (reload config without downtime)

# Lab 7: Write a Service Monitor Script

**Module:** 7 — Bash Scripting Essentials
**Time:** 20 minutes
**VM:** vm1

---

## Objective

Write a parameterized bash script that accepts a service name as a command-line argument, checks if the service is running, attempts to restart it if not, and logs the result to a file with a timestamp.

**Create your working directory:**
```bash
mkdir -p ~/crashcourse/lab7
cd ~/crashcourse/lab7
```

---

## Step 1: Plan before writing

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

## Step 2: Create the log directory

```bash
sudo mkdir -p /var/log/crashcourse
sudo chown student:student /var/log/crashcourse
chmod 750 /var/log/crashcourse
```

---

## Step 3: Write the script

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

## Step 4: Run shellcheck

```bash
shellcheck ~/crashcourse/lab7/monitor.sh
```

Fix any warnings before continuing. The script must pass with no warnings.

---

## Step 5: Make executable and test

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

## Step 6: Test the stopped service path

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

## Step 7: Add a trap (enhancement)

Add error trapping to the script. Edit `monitor.sh` and add this line immediately after `set -euo pipefail`:

```bash
trap 'log_msg "ERROR" "Script terminated unexpectedly at line $LINENO"' ERR
```

Note: Because we already handle errors explicitly with `if/else`, this trap mainly catches unexpected failures (e.g., log directory suddenly disappearing). Run shellcheck again after adding it.

---

## Checkpoint

Before moving on, confirm:
- [ ] The script accepts a service name argument and validates it
- [ ] It exits with code 1 and prints usage if no argument is given
- [ ] It logs with timestamps to the correct file
- [ ] shellcheck passes with no warnings
- [ ] You tested both the "service running" and "service not running" paths
- [ ] You tested with an invalid service name

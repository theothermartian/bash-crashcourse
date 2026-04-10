# Module 6 — Networking & Remote Operations
**Duration:** 15 min (8 min lecture + 10 min Lab 6)

---

## Slide 6-1: The Safety Warning

> "Always `rsync --dry-run` before syncing anything in production. An rsync without `--dry-run` that hits the wrong destination has deleted entire backup trees. The pattern: dry-run, inspect output, remove `--dry-run`, run for real."

---

## Slide 6-2: Network Inspection

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

## Slide 6-3: SSH — Secure Shell

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

## Slide 6-4: Copying Files Remotely

```
scp file.txt user@host:/remote/path/           — copy file to remote
scp user@host:/remote/path/file.txt ./         — copy from remote
scp -r directory/ user@host:/remote/path/      — copy directory recursively
scp -P 2222 file user@host:/path               — non-standard port
```

- `scp` is for ad-hoc file transfers
- For scripted, production transfers: use `rsync` (resumable, incremental)

---

## Slide 6-5: rsync — The Right Way to Sync

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
- `--delete` makes dest mirror src exactly. **ALWAYS dry-run before using `--delete`.**
- Note: trailing slash on `src/` matters. `src/` copies contents. `src` copies the directory itself.

---

## Slide 6-6: HTTP — curl

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

## Slide 6-7: Firewall — ufw

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

## Instructor Notes

**Timing:** 8 min lecture, 10 min lab. This module depends on VM2 being properly configured — test SSH access before the session begins.

**Pre-session setup required:**
- vm2 must be running and reachable from vm1
- SSH must be working (password or key-based)
- Create `/tmp/sync_dest/` on vm2 as writable by student user

**What to emphasize:**
- The rsync `--dry-run` discipline. Every single time. Then remove the flag. This is not optional.
- The trailing slash distinction in rsync: `src/` vs `src`. Show both and explain the difference.
- SSH key-based auth is the only acceptable method in production — but for this lab, passwords are fine.

**Common student mistakes:**
- Forgetting the trailing slash on rsync source — syncs the directory itself instead of its contents
- Skipping `--dry-run` because "it's just a test VM." Build the habit now.
- `scp -r` forgetting the `-r` when copying directories
- Confusion about which side of the scp command is source vs destination

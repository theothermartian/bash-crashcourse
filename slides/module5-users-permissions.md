# Module 5 — Users, Permissions & Packages
**Duration:** 15 min (8 min lecture + 10 min Lab 5)

---

## Slide 5-1: The Safety Warning

> "Principle of least privilege is not a guideline at a nuclear facility — it is a control. Every account has the minimum access to do its job. Granting `sudo` to an account must be documented with a justification. 'I needed to' is not a justification."

---

## Slide 5-2: User Management

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

## Slide 5-3: sudo and su

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

## Slide 5-4: Permissions — Numeric Mode

```
chmod 755 file     — rwxr-xr-x   (scripts, directories)
chmod 644 file     — rw-r--r--   (config files readable by all)
chmod 640 file     — rw-r-----   (config files for a group)
chmod 600 file     — rw-------   (private keys, credential files)
chmod 400 file     — r--------   (read-only backups, archives)
chmod 750 dir/     — rwxr-x---   (directory for owner and group)
```

**The rule for nuclear systems:**
- Credential files: `600` (owner read/write only)
- Scripts: `750` (owner can run, group can run, others cannot)
- Config files: `640` (owner rw, group r, no others)
- Never `777`. If you feel the urge to chmod 777, stop and ask why.

---

## Slide 5-5: umask

```
umask          — show current umask
umask 022      — set umask (files created with 644, dirs with 755)
umask 027      — tighter (files: 640, dirs: 750)
```

- umask subtracts permissions from the default (files: 666, dirs: 777)
- Set in `/etc/profile` or user's `~/.bashrc` for persistent effect
- Nuclear systems: `027` or tighter as the default umask

---

## Slide 5-6: Package Management

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

## Instructor Notes

**Timing:** 8 min lecture, 10 min lab. Short module — keep pace. The concepts are familiar from OS courses.

**What to emphasize:**
- The `-a` flag in `usermod -aG`. Without it, the user loses all other group memberships. Real production footgun.
- `600` for anything containing a password. No exceptions.
- The audit trail from `sudo` logging is a real control at nuclear facilities. Every privileged action is logged.

**Common student mistakes:**
- Forgetting `-m` in `useradd` — user is created but has no home directory and cannot log in
- Using `usermod -G` without `-a` and wiping all existing group memberships
- `chmod 777` as the solution to "I can't access this file" — correct solution: fix ownership or add user to right group
- Running `apt upgrade` in the lab as if it's harmless — on production systems this is a change window event

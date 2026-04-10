# Module 2 — Navigation & File Operations
**Duration:** 20 min (10 min lecture + 10 min Lab 2)

---

## Slide 2-1: The Safety Warning

> "`rm -rf $dir/*` with an unset or empty `$dir` will delete your current working directory. This has happened in production. It has taken down systems. We will reproduce it safely right now."

---

## Slide 2-2: Orientation Commands

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

## Slide 2-3: Finding Files

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

## Slide 2-4: Copying, Moving, Deleting

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

## Slide 2-5: The rm Guard Pattern — Memorize This

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

## Slide 2-6: Permissions

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

## Slide 2-7: File Testing Operators

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

## Slide 2-8: Symlinks

```
ln -s /actual/path /link/name   — create symbolic link
ls -la                          — shows link → target
readlink -f /link/name          — resolve the real path
```

- Symlinks are pointers. Deleting the link does not delete the target.
- Deleting the target leaves a "dangling" link.
- Common use: `/var/log/app/current` → `app-2026-04-09.log`

---

## Instructor Notes

**Timing:** 10 min lecture, 10 min lab. The `rm` safety demo is the most important moment — do it live before the lab.

**Live demo (before lecture slides end):**
1. Create `/tmp/demo_danger/` with some files
2. Set `dir=""` (empty)
3. Run `rm -rf $dir/*` (unquoted) — watch it fail or hit current directory
4. Recover. Show the guard pattern. Run it with empty var — guard fires.
5. This takes 3 minutes and students will never forget it.

**What to emphasize:**
- `find` is the right way to locate files. Do not browse manually on production systems.
- Permissions `777` are never acceptable. `600` for credentials. `750` for scripts.
- The symlink pattern — `current.log` → dated file — is a real production pattern.

**Common student mistakes:**
- Using `chmod 777` to "just make it work." Address directly: that's a security incident.
- Forgetting `-r` on `cp` for directories
- Running `find / -name "*.log"` without restricting the path — will churn for minutes
- Confusion between relative and absolute paths in `ln -s`. Absolute paths in symlinks are safer.

**Note on shellcheck in Step 3:** The warning for `$logdir` on the find command may surprise students. Walk through: if logdir contained a space, `find` would interpret it as two arguments.

# Lab 5: Users, Groups, Permissions, and Packages

**Module:** 5 — Users, Permissions & Packages
**Time:** 10 minutes
**VM:** vm1

---

## Step 1: Create a user

Create a new user called `ops_agent`:
```bash
sudo useradd -m -s /bin/bash ops_agent
```

Verify the user was created:
```bash
id ops_agent
ls -la /home/ops_agent/
```

---

## Step 2: Create a group and add the user

Create a group called `ops_team`:
```bash
sudo groupadd ops_team
```

Add `ops_agent` to the group:
```bash
sudo usermod -aG ops_team ops_agent
```

Verify:
```bash
id ops_agent
groups ops_agent
```

You should see `ops_team` in the output.

---

## Step 3: Set correct permissions on a config file

There is a file at `/opt/crashcourse/lab5/database.conf` with wrong permissions. Check them:
```bash
ls -la /opt/crashcourse/lab5/database.conf
```

The file is currently world-readable (`644`). This is wrong for a database credentials file. Fix it:

First, set ownership to the ops_agent user and ops_team group:
```bash
sudo chown ops_agent:ops_team /opt/crashcourse/lab5/database.conf
```

Then restrict permissions to owner-read/write, group-read, no others:
```bash
sudo chmod 640 /opt/crashcourse/lab5/database.conf
```

Verify:
```bash
ls -la /opt/crashcourse/lab5/database.conf
```

The output should show `-rw-r-----`.

Now make it even more restrictive — owner only (for a private key or password file):
```bash
sudo chmod 600 /opt/crashcourse/lab5/database.conf
ls -la /opt/crashcourse/lab5/database.conf
```

The output should show `-rw-------`.

---

## Step 4: Install packages

Confirm shellcheck is installed (you've been using it):
```bash
dpkg -l | grep shellcheck
```

Install `htop` if not already present:
```bash
sudo apt update
sudo apt install -y htop
```

Verify installation:
```bash
which htop
htop --version
```

Run htop briefly:
```bash
htop
```
Press `F10` or `q` to exit.

---

## Step 5: Check your own sudo permissions

List what your account can run with sudo:
```bash
sudo -l
```

Note what is allowed and what is not.

---

## Cleanup

Remove the test user created in Step 1 (keep the group):
```bash
sudo userdel ops_agent
```

Note: We do NOT use `-r` here because we keep the home directory for audit purposes.

---

## Checkpoint

Before moving on, confirm:
- [ ] You created a user and verified it with `id`
- [ ] You added the user to a group using `usermod -aG` (with the `a` flag)
- [ ] You changed a file from `644` to `640` then `600`
- [ ] You installed a package using apt

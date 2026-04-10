# Lab 6: SSH, SCP, rsync, and Port Inspection

**Module:** 6 — Networking & Remote Operations
**Time:** 10 minutes
**VMs:** vm1 (your primary) and vm2 (second VM, credentials provided by instructor)

---

## Setup

The instructor will provide you with:
- The IP address of vm2 (e.g., `192.168.1.X`)
- SSH credentials for vm2 (username and password, or pre-configured key)

Verify you can reach vm2:
```bash
ping -c 2 <vm2-ip>
```

Create your working area:
```bash
mkdir -p ~/crashcourse/lab6
```

---

## Step 1: SSH into vm2

```bash
ssh student@<vm2-ip>
```

Once connected, confirm you are on vm2:
```bash
hostname
ip addr
```

You should see a different hostname and IP than your vm1.

Run a couple of commands on vm2:
```bash
uptime
df -h /
```

Exit back to vm1:
```bash
exit
```

---

## Step 2: Copy a file with scp

On vm1, create a file to transfer:
```bash
echo "Transfer test from vm1 - $(date)" > ~/crashcourse/lab6/transfer_test.txt
```

Copy it to vm2:
```bash
scp ~/crashcourse/lab6/transfer_test.txt student@<vm2-ip>:/tmp/
```

Verify it arrived:
```bash
ssh student@<vm2-ip> "cat /tmp/transfer_test.txt"
```

Now copy a file from vm2 back to vm1:
```bash
scp student@<vm2-ip>:/etc/hostname ~/crashcourse/lab6/vm2_hostname.txt
cat ~/crashcourse/lab6/vm2_hostname.txt
```

---

## Step 3: rsync with dry-run first

Create a source directory with some files:
```bash
mkdir -p ~/crashcourse/lab6/sync_source
echo "config version 1.0" > ~/crashcourse/lab6/sync_source/app.conf
echo "reactor-id: unit-1" > ~/crashcourse/lab6/sync_source/reactor.conf
echo "temp data" > ~/crashcourse/lab6/sync_source/temp.tmp
```

First, dry-run rsync to vm2:
```bash
rsync -avz --dry-run \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

Read the output carefully. Note which files would be transferred.

Now run for real (remove `--dry-run`):
```bash
rsync -avz \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

Verify on vm2:
```bash
ssh student@<vm2-ip> "ls -la /tmp/sync_dest/"
```

Now add a file on vm1 and sync again. Note that rsync only transfers the new file:
```bash
echo "new data" > ~/crashcourse/lab6/sync_source/new_file.txt
rsync -avz \
  ~/crashcourse/lab6/sync_source/ \
  student@<vm2-ip>:/tmp/sync_dest/
```

---

## Step 4: Check open ports

On vm1:
```bash
ss -tulpn
```

Identify:
- What ports are listening on TCP?
- Which port is SSH using?

Use lsof to confirm who owns port 22:
```bash
sudo lsof -i :22
```

Check the firewall status:
```bash
sudo ufw status
```

---

## Checkpoint

Before moving on, confirm:
- [ ] You SSH'd into vm2 and ran commands there
- [ ] You copied a file with scp in both directions
- [ ] You ran rsync with `--dry-run` first, inspected the output, then ran for real
- [ ] You identified listening ports using `ss -tulpn`

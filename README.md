# Bash Crashcourse

A complete instructor-led bash training course for CS-background students becoming sysadmins or DBAs. The course uses a nuclear facility operations theme for scenario framing.

## What's Here

| Directory | Contents |
|-----------|----------|
| `slides/` | 8 slide decks (Modules 1–8) |
| `labs/` | 8 hands-on lab exercises |
| `interactive/` | Browser-based interactive bash lab (20 modules, 102 questions) |
| `scenario1-health-check/` | Extended scripting scenario — system health check |
| `scenario2-db-backup/` | Extended scripting scenario — database backup |
| `scenario3-incident-response/` | Extended scripting scenario — incident response |
| `shared/` | Bash cheatsheet |
| `vm-setup/` | VM provisioning scripts |
| `plans/` | Design docs and implementation plans |

## Course Structure

**Part 1** (~3 hours): Bash fundamentals through scripting essentials
- Module 1: Bash Fundamentals & The Nuclear Mindset
- Module 2: Navigation & File Operations
- Module 3: Text Processing
- Module 4: Process Management
- Module 5: Users & Permissions
- Module 6: Networking
- Module 7: Scripting Essentials
- Module 8: DB Admin

**Part 2**: Extended scenarios and the interactive self-paced lab

See `instructor-guide.md` for timing, pre-session checklist, and troubleshooting.

## Interactive Lab (Quick Start)

The interactive lab gives each student a real Alpine Linux terminal in the browser, paired with a 20-module quiz panel.

```bash
# 1. Build the container image (once)
cd interactive/runner
docker build -t bash-lab .

# 2. Start the server
cd interactive/backend
node server.js

# 3. Students open
http://localhost:3000
```

See `interactive/README.md` for full details.

## Student Materials

- `student-reference-card.md` — quick reference to hand out
- `shared/cheatsheet.md` — bash command cheatsheet

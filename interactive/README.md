# Bash Interactive Lab

A browser-based interactive bash learning environment. Students get a real terminal (Alpine Linux container) paired with a quiz panel — type real commands, get real output, earn real checkmarks.

## Quick Start

```bash
cd interactive/
./start.sh
```

Students open `http://<your-ip>:3000` in their browser. No setup required on their end.

## Requirements

- Docker (20+)
- docker-compose (v2+)

## Architecture

```
Browser (xterm.js + quiz panel)
    ↕ WebSocket
Node.js backend (port 3000)
    ↕ Docker socket
Alpine Linux container (one per student session)
```

## Content

**20 modules, ~97 questions** covering:

| Module | Topic |
|--------|-------|
| 1 | Navigation & Files |
| 2 | Pipes & Chaining |
| 3 | Redirection |
| 4 | Here-Docs & Here-Strings |
| 5 | Process Substitution |
| 6 | Subshells |
| 7 | Command Substitution |
| 8 | Variables & Quoting |
| 9 | Parameter Expansion |
| 10 | Special Variables |
| 11 | Arithmetic |
| 12 | Conditionals & Tests |
| 13 | Case Statements |
| 14 | Loops |
| 15 | Functions |
| 16 | Arrays |
| 17 | Globbing & Patterns |
| 18 | Text Processing |
| 19 | Job Control |
| 20 | Error Handling & Debugging |

## Adding Questions

Edit any file in `backend/questions/`. Each module is a JSON file:

```json
{
  "slug": "moduleNN-name",
  "name": "Display Name",
  "questions": [
    {
      "id": "mNN-qNN",
      "scenario": "Context narrative (nuclear facility framing)",
      "question": "What to do",
      "description": "Why this matters",
      "use_cases": ["Use case 1", "Use case 2"],
      "hints": ["Hint 1", "Hint 2", "Hint 3 (answer-level)"],
      "validation": { "type": "output_match", "command": "cmd", "pattern": "regex" }
    }
  ]
}
```

**Validation types:** `output_match`, `output_contains`, `file_exists`, `file_not_empty`, `file_contains`, `exit_code`, `multi`

## Safety

- Containers run as non-root `student` user
- 256MB RAM / 0.5 CPU limit per container
- No external network access
- Dangerous commands are blocklisted
- Commands timeout after 10 seconds
- Containers are destroyed on browser disconnect

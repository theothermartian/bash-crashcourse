# Bash Interactive Lab

A browser-based interactive bash learning environment. Students get a real terminal (Alpine Linux container) paired with a quiz panel — type real commands, get real output, earn real checkmarks.

## Requirements

- Docker 20+
- Node.js 18+

## Setup

```bash
# 1. Build the container image (one-time, ~1 minute)
cd interactive/runner
docker build -t bash-lab .

# 2. Install backend dependencies (one-time)
cd interactive/backend
npm install

# 3. Start the server
node server.js
```

Students open `http://localhost:3000`. No setup required on their end.

To run on a shared machine, replace `localhost` with the host IP.

## How It Works

```
Browser (xterm.js + quiz panel)
    ↕ WebSocket
Node.js backend (port 3000)
    ↕ Docker socket
Alpine Linux container (one per student session)
```

Each student session gets an isolated Alpine Linux container. The container is destroyed when the browser disconnects. The backend serves the frontend as static files — no separate web server needed.

## Content

**20 modules, 102 questions** covering:

| Module | Topic |
|--------|-------|
| 01 | Navigation & Files |
| 02 | Pipes & Chaining |
| 03 | Redirection |
| 04 | Here-Docs & Here-Strings |
| 05 | Process Substitution |
| 06 | Subshells |
| 07 | Command Substitution |
| 08 | Variables & Quoting |
| 09 | Parameter Expansion |
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

## Adding or Editing Questions

Each module is a JSON file in `backend/questions/`. Structure:

```json
{
  "slug": "module01-navigation",
  "name": "Navigation & Files",
  "questions": [
    {
      "id": "m01-q01",
      "scenario": "Context narrative",
      "question": "What to do",
      "description": "Why this matters",
      "use_cases": ["Use case 1", "Use case 2"],
      "hints": ["Hint 1", "Hint 2", "Hint 3 (answer-level)"],
      "validation": { "type": "output_match", "pattern": "^/" }
    }
  ]
}
```

### Validation Types

The validator runs the student's actual typed command and checks the result.

| Type | Checks | Required fields |
|------|--------|-----------------|
| `output_match` | stdout matches a regex | `pattern`, optional `flags` |
| `output_contains` | stdout contains a substring | `substring` |
| `exit_code` | command exits with a specific code | `expected` (default `0`), optional `command` |
| `file_exists` | a file or directory exists | `path` |
| `file_not_empty` | a file exists and is non-empty | `path` |
| `file_contains` | a file contains a pattern | `path`, `pattern` |
| `multi` | all sub-checks pass | `checks` (array of the above) |

**Important:** For `output_match` and `output_contains`, the validator runs the student's command directly — do not add a `command` field. For `exit_code`, `file_exists`, `file_not_empty`, and `file_contains`, the validator runs its own fixed command against container state.

### Writing Good Patterns

Patterns must be tight enough to reject plausible-but-wrong commands:

```json
// Too loose — ls -l also prints "total"
{ "type": "output_match", "pattern": "total" }

// Correct — " .." only appears when -a flag is used
{ "type": "output_contains", "substring": " .." }
```

Test your patterns against the container before committing:

```bash
docker run --rm bash-lab bash -c 'your-command-here'
```

## Running Tests

```bash
cd backend
npm test
```

Tests cover question bank integrity (all 102 questions valid) and quiz engine unit tests.

## Security Model

- Containers run as non-root `student` user
- 256MB RAM / 0.5 CPU per container (hard limits)
- 100 PID limit — prevents fork bombs at the OS level
- No external network access (`NetworkMode: none`)
- Max 10 concurrent sessions
- Containers destroyed on browser disconnect (`AutoRemove: true`)

Security relies on the Docker sandbox, not command filtering. There is no command denylist — it cannot be made reliable.

## Troubleshooting

**Spinner stuck on "Connecting to lab environment..."**
- Check Docker is running: `docker info`
- Check the `bash-lab` image exists: `docker images bash-lab`
- Check server logs for errors

**Container fails to start**
- Verify the image name matches: `RUNNER_IMAGE` env var or default `bash-lab`
- Check Docker has available memory

**Validation never passes**
- Make sure you're running the student's exact command, not a variation
- Run `docker run --rm bash-lab bash -c 'your-command'` to check output manually

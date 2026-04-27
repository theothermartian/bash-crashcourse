'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { createContainer, destroyContainer } = require('./container-manager');
const { QuizEngine } = require('./quiz-engine');

const PORT = parseInt(process.env.PORT || '3000', 10);
const MAX_SESSIONS = 10;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const VALIDATION_DELAY_MS = 700; // wait for shell to settle before validating

// ---------------------------------------------------------------------------
// Static file server
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(FRONTEND_DIR, path.normalize(urlPath));

  // Prevent path traversal
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403); res.end(); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// ---------------------------------------------------------------------------
// WebSocket session handler
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log(`[session] new connection from ${req.socket.remoteAddress}`);

  if (wss.clients.size > MAX_SESSIONS) {
    send(ws, { type: 'error', message: 'Server is at capacity. Please try again later.' });
    ws.close();
    return;
  }

  let container  = null;
  let termStream = null;          // raw duplex to the container TTY
  let quiz       = null;
  let validateTimer = null;
  let lastCmd = '';

  // ---------- bootstrap ----------
  (async () => {
    try {
      send(ws, { type: 'status', message: 'Starting your container...' });
      container = await createContainer();
      quiz = new QuizEngine();

      // Attach to the container's TTY (raw duplex stream, no mux headers for TTY=true)
      termStream = await container.attach({
        stream: true,
        stdin:  true,
        stdout: true,
        stderr: true,
        hijack: true,
      });

      termStream.on('data', (chunk) => {
        if (ws.readyState === 1) {
          send(ws, { type: 'output', data: chunk.toString('binary') });
        }
      });

      termStream.on('error', (err) => {
        console.error('[termStream error]', err.message);
      });

      termStream.on('end', () => {
        if (ws.readyState === 1) ws.close();
      });

      // Greet student and send first question
      const q = quiz.currentQuestion();
      send(ws, { type: 'ready' });
      send(ws, { type: 'question', data: q });

    } catch (err) {
      console.error('[session bootstrap error]', err.message);
      send(ws, { type: 'error', message: 'Failed to start container. Please refresh.' });
      ws.close();
    }
  })();

  // ---------- incoming messages ----------
  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }

    switch (msg.type) {

      case 'input': {
        // Raw keystroke from xterm — forward to container stdin
        if (!termStream) return;
        if (typeof msg.data !== 'string') return;

        const data = Buffer.from(msg.data, 'binary');
        const char = data.toString('utf8');

        // Track the current line for validation
        if (char === '\r') {
          const cmd = lastCmd.trim();
          lastCmd = '';

          // Forward Enter to container
          // (No denylist check — the Docker sandbox is the security boundary)
          termStream.write('\r');

          // Schedule validation after shell settles
          if (cmd) {
            clearTimeout(validateTimer);
            validateTimer = setTimeout(async () => {
              try {
                const result = await quiz.validate(container, cmd);
                send(ws, { type: 'result', passed: result.passed });

                if (result.passed) {
                  setTimeout(async () => {
                    const next = quiz.advance();
                    if (quiz.isFinished()) {
                      send(ws, { type: 'finished', score: quiz.moduleComplete() });
                    } else {
                      const crossedModule = quiz.questionIdx === 0 && quiz.moduleIdx > 0;
                      if (crossedModule) {
                        send(ws, { type: 'module_complete', data: quiz.moduleComplete() });
                        setTimeout(() => send(ws, { type: 'question', data: next }), 2000);
                      } else {
                        send(ws, { type: 'question', data: next });
                      }
                    }
                  }, 1500);
                }
              } catch (err) {
                console.error('[validate error]', err.message);
              }
            }, VALIDATION_DELAY_MS);
          }

        } else if (char === '\x7f' || char === '\x08') {
          // Backspace
          if (lastCmd.length > 0) lastCmd = lastCmd.slice(0, -1);
          termStream.write(data);
        } else if (char === '\x03') {
          // Ctrl-C — reset tracked line
          lastCmd = '';
          termStream.write(data);
        } else {
          lastCmd += char;
          termStream.write(data);
        }
        break;
      }

      case 'resize': {
        const cols = parseInt(msg.cols, 10);
        const rows = parseInt(msg.rows, 10);
        if (container && cols >= 1 && cols <= 500 && rows >= 1 && rows <= 200) {
          container.resize({ w: cols, h: rows }).catch(() => {});
        }
        break;
      }

      case 'hint': {
        if (!quiz) return;
        const hint = quiz.nextHint();
        if (hint) {
          send(ws, { type: 'hint', data: hint });
        } else {
          send(ws, { type: 'hint', data: null, message: 'No more hints.' });
        }
        break;
      }

      case 'skip': {
        if (!quiz) return;
        const next = quiz.advance();
        send(ws, { type: 'skipped' });
        if (quiz.isFinished()) {
          send(ws, { type: 'finished', score: quiz.moduleComplete() });
        } else {
          send(ws, { type: 'question', data: next });
        }
        break;
      }
    }
  });

  // ---------- cleanup on disconnect ----------
  ws.on('close', () => {
    console.log('[session] disconnected');
    clearTimeout(validateTimer);
    if (container) destroyContainer(container).catch(() => {});
  });

  ws.on('error', (err) => {
    console.error('[ws error]', err.message);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function send(ws, obj) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(obj));
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bash Interactive Lab → http://0.0.0.0:${PORT}`);
  console.log(`Frontend:  ${FRONTEND_DIR}`);
  console.log(`Questions: ${path.join(__dirname, 'questions')}`);
});

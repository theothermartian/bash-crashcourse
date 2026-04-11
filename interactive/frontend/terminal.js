'use strict';

// ---------------------------------------------------------------------------
// WebSocket connection
// ---------------------------------------------------------------------------

const WS_URL = `ws://${location.host}`;
let ws = null;
let wsReady = false;

function connectWS() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    wsReady = true;
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleServerMessage(msg);
  };

  ws.onclose = () => {
    wsReady = false;
    term.write('\r\n\x1b[31m[Connection closed. Refresh to start a new session.]\x1b[0m\r\n');
  };

  ws.onerror = () => {
    term.write('\r\n\x1b[31m[WebSocket error. Please refresh.]\x1b[0m\r\n');
  };
}

function wsSend(obj) {
  if (ws && wsReady) ws.send(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// xterm.js terminal
// ---------------------------------------------------------------------------

const term = new Terminal({
  cursorBlink: true,
  fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
  fontSize: 13,
  lineHeight: 1.3,
  theme: {
    background:  '#0d1117',
    foreground:  '#e6edf3',
    cursor:      '#00d4ff',
    cursorAccent:'#0d1117',
    black:       '#484f58',
    red:         '#f85149',
    green:       '#3fb950',
    yellow:      '#d29922',
    blue:        '#388bfd',
    magenta:     '#bc8cff',
    cyan:        '#39c5cf',
    white:       '#b1bac4',
    brightBlack: '#6e7681',
    brightRed:   '#ff7b72',
    brightGreen: '#56d364',
    brightYellow:'#e3b341',
    brightBlue:  '#79c0ff',
    brightMagenta:'#d2a8ff',
    brightCyan:  '#56d4dd',
    brightWhite: '#f0f6fc',
  },
  allowProposedApi: true,
  scrollback: 1000,
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

const container = document.getElementById('terminal-container');
term.open(container);
fitAddon.fit();

// Resize terminal when window resizes
window.addEventListener('resize', () => {
  fitAddon.fit();
  wsSend({ type: 'resize', cols: term.cols, rows: term.rows });
});

// Forward keystrokes verbatim to the backend as a raw string.
// The backend uses Buffer.from(msg.data, 'binary') to write to the container stdin.
term.onData((data) => {
  if (wsReady) {
    ws.send(JSON.stringify({ type: 'input', data }));
  }
});

// ---------------------------------------------------------------------------
// Receive output from server → write to terminal
// ---------------------------------------------------------------------------

function handleServerMessage(msg) {
  switch (msg.type) {

    case 'status':
      document.getElementById('status-msg').textContent = msg.message;
      break;

    case 'ready':
      document.getElementById('status-overlay').classList.add('hidden');
      // Send initial size
      wsSend({ type: 'resize', cols: term.cols, rows: term.rows });
      term.focus();
      break;

    case 'output':
      term.write(msg.data);
      break;

    case 'question':
      renderQuestion(msg.data);
      clearResult();
      break;

    case 'result':
      showResult(msg.passed);
      break;

    case 'hint':
      renderHint(msg.data);
      break;

    case 'blocked':
      showBanner('blocked', '🚫', msg.message);
      break;

    case 'module_complete':
      showModuleComplete(msg.data);
      break;

    case 'skipped':
      clearResult();
      break;

    case 'finished':
      showFinished(msg.score);
      break;

    case 'error':
      document.getElementById('status-msg').textContent = msg.message;
      break;
  }
}

// ---------------------------------------------------------------------------
// Exported for quiz.js
// ---------------------------------------------------------------------------

window.wsSend = wsSend;

// Boot
connectWS();

'use strict';

const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const RUNNER_IMAGE = process.env.RUNNER_IMAGE || 'bash-crashcourse-runner';

// Commands that are too dangerous even in isolated containers
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\/(?:\s|$)/,          // rm -rf /
  /:\(\)\s*\{\s*:\s*\|\s*:&\s*\}/,  // fork bomb
  /dd\s+if=\/dev\/(?:zero|random)/,  // disk wipe
  /mkfs\./,                          // format filesystem
  />\s*\/dev\/(?:sda|sdb|nvme)/,     // write to block device
];

/**
 * Spawn a fresh Alpine runner container for one student session.
 * Returns the dockerode container object.
 */
async function createContainer() {
  const container = await docker.createContainer({
    Image: RUNNER_IMAGE,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    Cmd: ['/bin/bash', '--login'],
    Env: [
      'TERM=xterm-256color',
      'PS1=student@reactor:~\\$ ',
      'SHELL=/bin/bash',
    ],
    HostConfig: {
      Memory: 256 * 1024 * 1024,  // 256 MB
      CpuPeriod: 100000,
      CpuQuota: 50000,             // 0.5 CPU
      NetworkMode: 'none',         // no external network
      AutoRemove: true,            // destroy on stop
    },
    WorkingDir: '/home/student',
  });

  await container.start();
  return container;
}

/**
 * Gracefully stop then force-kill a container.
 */
async function destroyContainer(container) {
  try {
    await container.stop({ t: 2 });
  } catch (_) {
    try { await container.kill(); } catch (_2) { /* already gone */ }
  }
}

/**
 * Run a one-shot command inside the container for validation purposes.
 * Returns { stdout, exitCode, timedOut }.
 * Uses a separate exec (not the student's shell session).
 */
async function execCheck(container, cmd, timeoutMs = 8000) {
  return new Promise(async (resolve) => {
    let settled = false;
    const finish = (result) => {
      if (!settled) { settled = true; resolve(result); }
    };

    const timer = setTimeout(() => {
      finish({ stdout: '', exitCode: -1, timedOut: true });
    }, timeoutMs);

    try {
      const exec = await container.exec({
        Cmd: ['bash', '-c', cmd],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
      });

      const stream = await exec.start({ hijack: false, stdin: false });

      let raw = Buffer.alloc(0);
      stream.on('data', (chunk) => {
        raw = Buffer.concat([raw, chunk]);
      });

      stream.on('end', async () => {
        clearTimeout(timer);
        // Docker multiplexed stream: strip 8-byte header per frame
        const stdout = demux(raw);
        let exitCode = 0;
        try {
          const info = await exec.inspect();
          exitCode = info.ExitCode;
        } catch (_) {}
        finish({ stdout: stdout.trim(), exitCode, timedOut: false });
      });

      stream.on('error', () => finish({ stdout: '', exitCode: -1, timedOut: false }));
    } catch (err) {
      clearTimeout(timer);
      finish({ stdout: '', exitCode: -1, timedOut: false });
    }
  });
}

/**
 * Strip Docker multiplexed stream headers (8 bytes per frame).
 * Frame layout: [streamType(1), 0(3), size(4 big-endian), payload]
 */
function demux(buf) {
  let out = '';
  let offset = 0;
  while (offset + 8 <= buf.length) {
    const size = buf.readUInt32BE(offset + 4);
    const payload = buf.slice(offset + 8, offset + 8 + size);
    out += payload.toString('utf8');
    offset += 8 + size;
  }
  return out;
}

/**
 * Return true if the command matches a known dangerous pattern.
 */
function isBlocked(cmd) {
  return BLOCKED_PATTERNS.some((p) => p.test(cmd));
}

module.exports = { createContainer, destroyContainer, execCheck, isBlocked };

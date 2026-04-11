'use strict';

const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const RUNNER_IMAGE = process.env.RUNNER_IMAGE || 'bash-lab';

// NOTE: A regex denylist for dangerous shell commands was intentionally removed.
// Denylists are trivially bypassed with whitespace variations, escape characters,
// variable expansion, quoting, or encoding tricks (e.g. "rm   -rf  /" or
// "$(rm) -rf /" or `r\m -rf /`). They provide false security.
// Real protection comes from the Docker container sandbox: each session runs in an
// isolated, ephemeral container with no network, hard memory/CPU limits, and a
// PID limit to prevent fork bombs at the OS level.

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
      PidsLimit: 100,              // prevent fork bombs at OS level
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
    console.error('[destroyContainer] stop failed, trying kill:', _.message);
    try { await container.kill(); } catch (_2) {
      if (_2.statusCode === 404 || (_2.message && _2.message.includes('No such container'))) {
        // already gone — suppress
      } else {
        console.error('[destroyContainer] kill also failed:', _2.message);
      }
    }
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

// isBlocked() was removed. Regex denylists cannot reliably block dangerous shell
// commands and give a false sense of security. The container sandbox (resource
// limits, no network, PID cap) is the authoritative protection layer.

module.exports = { createContainer, destroyContainer, execCheck };

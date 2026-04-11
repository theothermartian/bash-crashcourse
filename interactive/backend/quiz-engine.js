'use strict';

const fs = require('fs');
const path = require('path');
const { execCheck } = require('./container-manager');

const QUESTIONS_DIR = path.join(__dirname, 'questions');

class QuizEngine {
  constructor() {
    this.modules = loadModules();
    this.moduleIdx = 0;
    this.questionIdx = 0;
    this.hintIdx = 0;
    this.passedCount = 0;
    this.attemptCount = 0;
  }

  /** Return the current question payload (safe to send to client). */
  currentQuestion() {
    const mod = this.modules[this.moduleIdx];
    if (!mod) return null;
    const q = mod.questions[this.questionIdx];
    return {
      moduleSlug:    mod.slug,
      moduleName:    mod.name,
      moduleIndex:   this.moduleIdx + 1,
      totalModules:  this.modules.length,
      questionIndex: this.questionIdx + 1,
      totalQuestions: mod.questions.length,
      id:            q.id,
      scenario:      q.scenario,
      question:      q.question,
      description:   q.description,
      use_cases:     q.use_cases,
      hintCount:     q.hints.length,
    };
  }

  /** Return the next hint for the current question, or null if exhausted. */
  nextHint() {
    const q = this._currentQ();
    if (this.hintIdx >= q.hints.length) return null;
    const text = q.hints[this.hintIdx];
    this.hintIdx++;
    return {
      text,
      index: this.hintIdx,
      total: q.hints.length,
      isLast: this.hintIdx >= q.hints.length,
    };
  }

  /**
   * Validate the student's last command against the current question rules.
   * Returns { passed: bool, message: string }.
   */
  async validate(container, studentCmd) {
    this.attemptCount++;
    const q = this._currentQ();
    const passed = await runCheck(container, studentCmd, q.validation);
    return { passed, message: passed ? q.successMessage || 'Correct!' : '' };
  }

  /**
   * Advance to the next question. Returns the next question or null if course complete.
   */
  advance() {
    this.passedCount++;
    this.hintIdx = 0;

    const mod = this.modules[this.moduleIdx];
    this.questionIdx++;

    if (this.questionIdx >= mod.questions.length) {
      this.moduleIdx++;
      this.questionIdx = 0;
    }

    return this.currentQuestion();
  }

  moduleComplete() {
    const mod = this.modules[this.moduleIdx - 1] || this.modules[this.moduleIdx];
    return {
      moduleName: mod.name,
      passed: this.passedCount,
      total: this.attemptCount,
    };
  }

  isFinished() {
    return this.moduleIdx >= this.modules.length;
  }

  _currentQ() {
    return this.modules[this.moduleIdx].questions[this.questionIdx];
  }
}

// ---------------------------------------------------------------------------
// Validation runner
// ---------------------------------------------------------------------------

function shellEscape(str) {
  return "'" + String(str).replace(/'/g, "'\\''") + "'";
}

async function runCheck(container, studentCmd, v) {
  switch (v.type) {
    case 'output_match': {
      const { stdout } = await execCheck(container, studentCmd);
      return new RegExp(v.pattern, v.flags || '').test(stdout);
    }
    case 'output_contains': {
      const { stdout } = await execCheck(container, studentCmd);
      return stdout.includes(v.substring);
    }
    case 'exit_code': {
      // Run the command and check its exit code
      const cmd = v.command || studentCmd;
      const { exitCode } = await execCheck(container, cmd);
      return exitCode === (v.expected ?? 0);
    }
    case 'file_exists': {
      const { stdout } = await execCheck(container, `test -e ${shellEscape(v.path)} && echo OK`);
      return stdout === 'OK';
    }
    case 'file_not_empty': {
      const { stdout } = await execCheck(container, `test -s ${shellEscape(v.path)} && echo OK`);
      return stdout === 'OK';
    }
    case 'file_contains': {
      const { stdout } = await execCheck(container, `grep -q ${shellEscape(v.pattern)} ${shellEscape(v.path)} && echo OK`);
      return stdout === 'OK';
    }
    case 'multi': {
      for (const check of v.checks) {
        const ok = await runCheck(container, studentCmd, check);
        if (!ok) return false;
      }
      return true;
    }
    default:
      console.warn(`Unknown validation type: ${v.type}`);
      return false;
  }
}

// ---------------------------------------------------------------------------
// Module loader
// ---------------------------------------------------------------------------

function loadModules() {
  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8');
    return JSON.parse(raw);
  });
}

module.exports = { QuizEngine };

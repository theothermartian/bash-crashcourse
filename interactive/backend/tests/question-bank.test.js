'use strict';

/**
 * Question bank integrity tests.
 * Run with: node tests/question-bank.test.js
 *
 * These tests run WITHOUT Docker — they validate the JSON structure and
 * validation logic only. No containers needed.
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '..', 'questions');
const VALID_TYPES = ['output_match', 'output_contains', 'file_exists', 'file_not_empty', 'file_contains', 'exit_code', 'multi'];

let passed = 0;
let failed = 0;
const failures = [];

// ---------------------------------------------------------------------------
// Tiny test runner (no dependencies)
// ---------------------------------------------------------------------------

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(a)} to equal ${JSON.stringify(b)}`);
}

// ---------------------------------------------------------------------------
// Load all modules
// ---------------------------------------------------------------------------

function loadModules() {
  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
  return files.map(f => ({
    file: f,
    ...JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'))
  }));
}

// ---------------------------------------------------------------------------
// Validate a single check object (recursive for multi)
// ---------------------------------------------------------------------------

function validateCheck(check, context) {
  assert(check.type, `${context}: validation.type is required`);
  assert(VALID_TYPES.includes(check.type), `${context}: unknown validation type '${check.type}'`);

  if (check.type === 'output_match') {
    assert(check.pattern, `${context}: output_match requires 'pattern'`);
    // Verify pattern compiles as regex
    try { new RegExp(check.pattern); } catch(e) {
      throw new Error(`${context}: invalid regex pattern '${check.pattern}': ${e.message}`);
    }
  }

  if (check.type === 'output_contains') {
    assert(check.substring, `${context}: output_contains requires 'substring'`);
  }

  if (check.type === 'file_exists' || check.type === 'file_not_empty') {
    assert(check.path, `${context}: ${check.type} requires 'path'`);
  }

  if (check.type === 'file_contains') {
    assert(check.path, `${context}: file_contains requires 'path'`);
    assert(check.pattern, `${context}: file_contains requires 'pattern'`);
  }

  if (check.type === 'exit_code') {
    assert(typeof check.expected === 'number', `${context}: exit_code requires numeric 'expected'`);
  }

  if (check.type === 'multi') {
    assert(Array.isArray(check.checks) && check.checks.length > 0, `${context}: multi requires non-empty 'checks' array`);
    check.checks.forEach((c, i) => validateCheck(c, `${context}.checks[${i}]`));
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const modules = loadModules();

console.log('\n=== Question Bank Integrity Tests ===\n');

// Test 1: All 20 modules exist
console.log('Module structure:');
test('all 20 module files exist', () => {
  assertEqual(modules.length, 20, `Expected 20 modules, found ${modules.length}`);
});

test('modules are numbered 01-20 in filename order', () => {
  for (let i = 0; i < modules.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    assert(modules[i].file.startsWith(`module${n}`),
      `Module ${i+1}: expected filename to start with 'module${n}', got '${modules[i].file}'`);
  }
});

// Test 2: Each module has required fields
console.log('\nModule fields:');
modules.forEach(mod => {
  test(`${mod.file}: has slug, name, questions`, () => {
    assert(mod.slug, 'missing slug');
    assert(mod.name, 'missing name');
    assert(Array.isArray(mod.questions) && mod.questions.length > 0, 'missing or empty questions array');
  });

  test(`${mod.file}: has at least 4 questions`, () => {
    assert(mod.questions.length >= 4,
      `Expected >= 4 questions, found ${mod.questions.length}`);
  });
});

// Test 3: Each question has required fields
console.log('\nQuestion fields:');
modules.forEach(mod => {
  mod.questions.forEach((q, qi) => {
    const ctx = `${mod.file} q[${qi}]`;
    test(`${ctx}: has all required fields`, () => {
      assert(q.id,          `${ctx}: missing id`);
      assert(q.scenario,    `${ctx}: missing scenario`);
      assert(q.question,    `${ctx}: missing question`);
      assert(q.description, `${ctx}: missing description`);
      assert(Array.isArray(q.use_cases) && q.use_cases.length >= 1, `${ctx}: missing or empty use_cases`);
      assert(Array.isArray(q.hints) && q.hints.length === 3, `${ctx}: hints must be array of exactly 3`);
      assert(q.validation,  `${ctx}: missing validation`);
    });
  });
});

// Test 4: Validation rules are structurally valid
console.log('\nValidation rules:');
modules.forEach(mod => {
  mod.questions.forEach((q, qi) => {
    const ctx = `${mod.file} q[${qi}] (${q.id})`;
    test(`${ctx}: valid validation structure`, () => {
      validateCheck(q.validation, ctx);
    });
  });
});

// Test 5: Question IDs are unique
console.log('\nUniqueness:');
test('all question IDs are unique across all modules', () => {
  const ids = [];
  modules.forEach(mod => {
    mod.questions.forEach(q => ids.push(q.id));
  });
  const unique = new Set(ids);
  assertEqual(unique.size, ids.length,
    `Duplicate question IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(', ')}`);
});

test('all module slugs are unique', () => {
  const slugs = modules.map(m => m.slug);
  const unique = new Set(slugs);
  assertEqual(unique.size, slugs.length, 'Duplicate slugs found');
});

// Test 6: Content quality checks
console.log('\nContent quality:');
test('all scenarios are at least 20 characters', () => {
  const short = [];
  modules.forEach(mod => {
    mod.questions.forEach(q => {
      if (q.scenario.length < 20) short.push(q.id);
    });
  });
  assert(short.length === 0, `Short scenarios in: ${short.join(', ')}`);
});

test('all hints are non-empty strings', () => {
  const bad = [];
  modules.forEach(mod => {
    mod.questions.forEach(q => {
      q.hints.forEach((h, i) => {
        if (typeof h !== 'string' || h.trim().length === 0)
          bad.push(`${q.id} hint[${i}]`);
      });
    });
  });
  assert(bad.length === 0, `Empty hints: ${bad.join(', ')}`);
});

test('all use_cases are non-empty strings', () => {
  const bad = [];
  modules.forEach(mod => {
    mod.questions.forEach(q => {
      q.use_cases.forEach((uc, i) => {
        if (typeof uc !== 'string' || uc.trim().length === 0)
          bad.push(`${q.id} use_case[${i}]`);
      });
    });
  });
  assert(bad.length === 0, `Empty use_cases: ${bad.join(', ')}`);
});

// Test 7: Total question count
console.log('\nSummary stats:');
test('total question count is >= 80', () => {
  const total = modules.reduce((sum, m) => sum + m.questions.length, 0);
  assert(total >= 80, `Expected >= 80 questions, found ${total}`);
  console.log(`    Total questions: ${total} across ${modules.length} modules`);
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log('\n===========================');
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('  All tests passed ✓');
}

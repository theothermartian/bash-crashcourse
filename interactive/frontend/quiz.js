'use strict';

// ---------------------------------------------------------------------------
// Quiz panel state
// ---------------------------------------------------------------------------

let currentHintIndex = 0;
let maxHints = 0;
let resultTimeout = null;

// ---------------------------------------------------------------------------
// Render question into the panel
// ---------------------------------------------------------------------------

function renderQuestion(q) {
  currentHintIndex = 0;
  maxHints = q.hintCount || 0;

  // Module + counter
  document.getElementById('q-module').textContent = `Module ${q.moduleIndex} of ${q.totalModules} — ${q.moduleName}`;
  document.getElementById('q-counter').textContent = `Question ${q.questionIndex} of ${q.totalQuestions}`;

  // Progress bar
  const pct = ((q.moduleIndex - 1) / q.totalModules + (q.questionIndex / q.totalQuestions) / q.totalModules) * 100;
  document.getElementById('progress-bar').style.width = pct.toFixed(1) + '%';

  // Content
  document.getElementById('q-scenario').textContent  = q.scenario;
  document.getElementById('q-question').textContent  = q.question;
  document.getElementById('q-description').textContent = q.description;

  // Use cases
  const ul = document.getElementById('q-usecases');
  ul.innerHTML = '';
  (q.use_cases || []).forEach((uc) => {
    const li = document.createElement('li');
    li.textContent = uc;
    ul.appendChild(li);
  });

  // Hints
  updateHintButton();
  document.getElementById('hint-display').innerHTML = '';

  // Collapse description by default
  const descBody = document.getElementById('desc-body');
  const descToggle = document.getElementById('desc-toggle');
  descBody.classList.remove('open');
  descToggle.classList.remove('open');
}

// ---------------------------------------------------------------------------
// Collapsible sections
// ---------------------------------------------------------------------------

function toggleCollapsible(id) {
  const body   = document.getElementById(id + '-body');
  const header = document.getElementById(id + '-toggle');
  body.classList.toggle('open');
  header.classList.toggle('open');
}

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------

function requestHint() {
  window.wsSend({ type: 'hint' });
}

function renderHint(data) {
  if (!data) return;

  currentHintIndex = data.index;
  updateHintButton();

  const display = document.getElementById('hint-display');
  const box = document.createElement('div');
  box.className = 'hint-box';
  box.innerHTML = `<div class="hint-meta">Hint ${data.index} of ${data.total}</div>${escapeHtml(data.text)}`;
  display.appendChild(box);
  display.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateHintButton() {
  const btn = document.getElementById('hint-btn');
  const counter = document.getElementById('hint-count');

  if (maxHints === 0) {
    btn.disabled = true;
    counter.textContent = '';
    return;
  }

  const remaining = maxHints - currentHintIndex;
  btn.disabled = remaining <= 0;
  counter.textContent = remaining > 0 ? `(${remaining} left)` : '(none left)';
}

// ---------------------------------------------------------------------------
// Result banner
// ---------------------------------------------------------------------------

function showResult(passed) {
  clearTimeout(resultTimeout);
  if (passed) {
    showBanner('pass', '✓', 'Correct! Well done, operator.');
    resultTimeout = setTimeout(clearResult, 3000);
  } else {
    showBanner('fail', '✗', 'Not quite. Try again or use a hint.');
    resultTimeout = setTimeout(clearResult, 4000);
  }
}

function showBanner(cls, icon, text) {
  const banner = document.getElementById('result-banner');
  banner.className = cls;
  document.getElementById('result-icon').textContent = icon;
  document.getElementById('result-text').textContent = text;
}

function clearResult() {
  const banner = document.getElementById('result-banner');
  banner.className = '';
}

// ---------------------------------------------------------------------------
// Module complete
// ---------------------------------------------------------------------------

function showModuleComplete(data) {
  document.getElementById('module-complete-text').textContent =
    `${data.moduleName} complete. ${data.passed} questions passed.`;
  document.getElementById('module-overlay').classList.add('show');
}

function dismissModuleOverlay() {
  document.getElementById('module-overlay').classList.remove('show');
}

// ---------------------------------------------------------------------------
// Skip
// ---------------------------------------------------------------------------

function skipQuestion() {
  window.wsSend({ type: 'skip' });
}

// ---------------------------------------------------------------------------
// Finished
// ---------------------------------------------------------------------------

function showFinished(score) {
  document.getElementById('q-module').textContent = 'All modules complete!';
  document.getElementById('q-counter').textContent = '';
  document.getElementById('q-scenario').textContent = 'You have completed the Bash Interactive Lab.';
  document.getElementById('q-question').textContent =
    `Final score: ${score.passed} questions passed. Well done, operator.`;
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('hint-display').innerHTML = '';
  document.getElementById('hint-btn').disabled = true;
  document.getElementById('skip-btn').style.display = 'none';
  showBanner('pass', '⚛', 'Training complete. Reactor Block A thanks you.');
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Expose to HTML onclick handlers
window.toggleCollapsible  = toggleCollapsible;
window.requestHint        = requestHint;
window.skipQuestion       = skipQuestion;
window.dismissModuleOverlay = dismissModuleOverlay;

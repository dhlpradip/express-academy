/**
 * Runs a student's Express app in this (isolated) process and executes an
 * HTTP test spec against it. Communicates results back to the parent by
 * printing a single line prefixed with @@RESULTS@@ so student console.logs
 * can't corrupt the protocol.
 *
 * Usage: node child-runner.cjs <userFile> <testsFile>
 */
const fs = require('fs');

const [, , userFile, testsFile] = process.argv;
const tests = JSON.parse(fs.readFileSync(testsFile, 'utf8'));

function emit(payload) {
  process.stdout.write('\n@@RESULTS@@' + JSON.stringify(payload) + '\n');
}

function fatal(message) {
  emit({ fatal: message });
  process.exit(0);
}

// Hard kill switch in case student code hangs (infinite loop, never-ending handler).
const killer = setTimeout(() => {
  fatal('Timed out after 9 seconds. Check for handlers that never send a response, or infinite loops.');
}, 9000);

process.on('uncaughtException', (err) => {
  fatal('Your app crashed while handling a request:\n' + shortStack(err));
});
process.on('unhandledRejection', (err) => {
  fatal(
    'An async error escaped without being handled (unhandled promise rejection):\n' +
      shortStack(err) +
      '\nHint: async errors must be passed to next(err) or caught with try/catch.'
  );
});

function shortStack(err) {
  if (err && err.stack) return err.stack.split('\n').slice(0, 5).join('\n');
  return String(err);
}

let app;
try {
  app = require(userFile);
} catch (err) {
  fatal('Your code threw while loading:\n' + shortStack(err));
}
if (app && app.default) app = app.default;
if (typeof app !== 'function') {
  fatal(
    "Nothing usable was exported. End your file with `module.exports = app;` (JS) or `export default app;` (TS), and don't call app.listen() — the test runner starts the server for you."
  );
}

// ---------- test engine ----------

const vars = {}; // values captured with `save`, usable as {{name}} in later tests

function template(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, name) => (name in vars ? String(vars[name]) : `{{${name}}}`));
}

function templateDeep(value) {
  if (typeof value === 'string') {
    // A string that is EXACTLY "{{var}}" substitutes the raw captured value,
    // preserving its type (numbers stay numbers for JSON comparisons).
    const exact = value.match(/^\{\{(\w+)\}\}$/);
    if (exact && exact[1] in vars) return vars[exact[1]];
    return template(value);
  }
  if (Array.isArray(value)) return value.map(templateDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = templateDeep(v);
    return out;
  }
  return value;
}

/** exp is a subset-pattern: objects match if every listed key matches; arrays must match exactly (same length, per-index). */
function subsetMatch(exp, act) {
  if (exp === null || typeof exp !== 'object') return exp === act;
  if (Array.isArray(exp)) {
    if (!Array.isArray(act) || act.length !== exp.length) return false;
    return exp.every((e, i) => subsetMatch(e, act[i]));
  }
  if (act === null || typeof act !== 'object') return false;
  return Object.entries(exp).every(([k, v]) => subsetMatch(v, act[k]));
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function preview(value) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  if (s === undefined) return 'undefined';
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
}

async function performRequest(base, spec) {
  const path = template(spec.path);
  const headers = {};
  for (const [k, v] of Object.entries(spec.headers || {})) headers[k] = template(v);
  const init = { method: spec.method || 'GET', headers };
  if (spec.json !== undefined) {
    headers['content-type'] = headers['content-type'] || 'application/json';
    init.body = JSON.stringify(templateDeep(spec.json));
  }
  const started = Date.now();
  const res = await fetch(base + path, init);
  const ms = Date.now() - started;
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: res.status, headers: res.headers, text, json, ms };
}

function evaluate(expect, res) {
  const failures = [];

  if (expect.status !== undefined && res.status !== expect.status) {
    failures.push(`expected status ${expect.status}, got ${res.status} (body: ${preview(res.text)})`);
  }
  const contains = expect.bodyContains === undefined ? [] : [].concat(expect.bodyContains);
  for (const needle of contains) {
    if (!res.text.toLowerCase().includes(String(needle).toLowerCase())) {
      failures.push(`expected body to contain "${needle}", got: ${preview(res.text) || '(empty body)'}`);
    }
  }
  if (expect.json !== undefined) {
    if (res.json === undefined) {
      failures.push(`expected a JSON response, got: ${preview(res.text) || '(empty body)'}`);
    } else if (!subsetMatch(templateDeep(expect.json), res.json)) {
      failures.push(`expected JSON to include ${preview(templateDeep(expect.json))}, got: ${preview(res.json)}`);
    }
  }
  for (const path of expect.jsonHas || []) {
    const v = res.json === undefined ? undefined : getPath(res.json, path);
    if (v === undefined || v === null) {
      failures.push(`expected JSON to have a "${path}" field, got: ${preview(res.json ?? res.text)}`);
    }
  }
  if (expect.jsonLength !== undefined) {
    if (!Array.isArray(res.json)) {
      failures.push(`expected a JSON array, got: ${preview(res.json ?? res.text)}`);
    } else if (res.json.length !== expect.jsonLength) {
      failures.push(`expected an array of length ${expect.jsonLength}, got length ${res.json.length}: ${preview(res.json)}`);
    }
  }
  for (const [path, min] of Object.entries(expect.jsonMin || {})) {
    const v = res.json === undefined ? undefined : getPath(res.json, path);
    if (typeof v !== 'number' || v < min) {
      failures.push(`expected JSON "${path}" to be a number >= ${min}, got: ${preview(v)}`);
    }
  }
  for (const [name, needle] of Object.entries(expect.headers || {})) {
    const actual = res.headers.get(name);
    if (actual === null) {
      failures.push(`expected response header "${name}" to be set`);
    } else if (!actual.toLowerCase().includes(template(String(needle)).toLowerCase())) {
      failures.push(`expected header "${name}" to contain "${needle}", got "${actual}"`);
    }
  }
  for (const name of expect.headerMissing || []) {
    if (res.headers.get(name) !== null) {
      failures.push(`expected header "${name}" to be absent, but it was "${res.headers.get(name)}"`);
    }
  }
  if (expect.maxMs !== undefined && res.ms > expect.maxMs) {
    failures.push(
      `expected the response within ${expect.maxMs}ms, took ${res.ms}ms — are you running the async calls in parallel?`
    );
  }
  return failures;
}

async function run() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const results = [];
  for (const t of tests) {
    const result = { name: t.name, pass: false, detail: '' };
    try {
      // Some tests observe background work (queues, schedules) — wait first.
      if (t.request.delayMs) await new Promise((r) => setTimeout(r, t.request.delayMs));
      const times = t.request.repeat || 1;
      let res;
      for (let i = 0; i < times; i++) res = await performRequest(base, t.request);
      const failures = evaluate(t.expect || {}, res);
      if (failures.length === 0) {
        result.pass = true;
        for (const [name, path] of Object.entries(t.save || {})) {
          if (path.startsWith('headers.')) vars[name] = res.headers.get(path.slice('headers.'.length));
          else if (path.startsWith('json.')) vars[name] = getPath(res.json, path.slice('json.'.length));
          else if (path === 'json') vars[name] = res.json;
          else if (path === 'text') vars[name] = res.text;
        }
      } else {
        result.detail = failures.join('\n');
      }
    } catch (err) {
      result.detail = 'request failed: ' + (err && err.message ? err.message : String(err));
    }
    results.push(result);
  }

  clearTimeout(killer);
  emit({ results });
  process.exit(0);
}

run().catch((err) => fatal('Test run crashed: ' + shortStack(err)));

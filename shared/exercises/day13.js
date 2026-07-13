/** @type {import('./index.js').Exercise} */
export default {
  id: 'day13',
  title: 'Async patterns under pressure',
  starter: `const express = require('express');
const app = express();

// ---- provided upstream services (do not edit) ---------------------------
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function getTemperature() { await delay(150); return 21; }
async function getHumidity() { await delay(150); return 60; }
async function flakyService() { await delay(20); throw new Error('service down'); }
// --------------------------------------------------------------------------

// TODO 1: GET /weather
//   -> call getTemperature() AND getHumidity() IN PARALLEL (Promise.all),
//      then respond { "temp": 21, "humidity": 60 }.
//   Each call takes 150ms. Sequential awaits = ~300ms total and the test
//   fails on time; parallel = ~150ms and it passes.

// TODO 2: GET /crash-test
//   -> call flakyService() with try/catch.
//      When it throws, respond 502 { "error": "service down" }.
//      502 Bad Gateway = "an upstream dependency failed", which is more
//      honest than a generic 500 here.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function getTemperature() { await delay(150); return 21; }
async function getHumidity() { await delay(150); return 60; }
async function flakyService() { await delay(20); throw new Error('service down'); }

app.get('/weather', async (req, res, next) => {
  try {
    const [temp, humidity] = await Promise.all([getTemperature(), getHumidity()]);
    res.json({ temp, humidity });
  } catch (err) {
    next(err);
  }
});

app.get('/crash-test', async (req, res) => {
  try {
    await flakyService();
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// ---- provided upstream services (do not edit) ---------------------------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function getTemperature(): Promise<number> { await delay(150); return 21; }
async function getHumidity(): Promise<number> { await delay(150); return 60; }
async function flakyService(): Promise<never> { await delay(20); throw new Error('service down'); }
// --------------------------------------------------------------------------

// TODO 1: GET /weather
//   -> getTemperature() AND getHumidity() IN PARALLEL (Promise.all),
//      respond { "temp": 21, "humidity": 60 }.
//   TS bonus: Promise.all infers the tuple — const [temp, humidity] is [number, number].

// TODO 2: GET /crash-test
//   -> flakyService() in try/catch; on failure respond 502 { "error": "service down" }.
//   TS gotcha: the catch variable is \`unknown\` — narrow with instanceof Error.

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function getTemperature(): Promise<number> { await delay(150); return 21; }
async function getHumidity(): Promise<number> { await delay(150); return 60; }
async function flakyService(): Promise<never> { await delay(20); throw new Error('service down'); }

app.get('/weather', async (req: Request, res: Response) => {
  // Inferred as [number, number] — both calls start immediately.
  const [temp, humidity] = await Promise.all([getTemperature(), getHumidity()]);
  res.json({ temp, humidity });
});

app.get('/crash-test', async (req: Request, res: Response) => {
  try {
    await flakyService();
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'upstream failure';
    res.status(502).json({ error: message });
  }
});

export default app;
`,
  tests: [
    {
      name: '/weather returns both readings',
      request: { method: 'GET', path: '/weather' },
      expect: { status: 200, json: { temp: 21, humidity: 60 } },
    },
    {
      name: '/weather responds in ~150ms, not ~300ms (calls must run in parallel)',
      request: { method: 'GET', path: '/weather' },
      expect: { status: 200, maxMs: 260 },
    },
    {
      name: '/crash-test maps the upstream failure to a 502',
      request: { method: 'GET', path: '/crash-test' },
      expect: { status: 502, json: { error: 'service down' } },
    },
    {
      name: 'The failure was handled — the server did not crash',
      request: { method: 'GET', path: '/weather' },
      expect: { status: 200 },
    },
  ],
};

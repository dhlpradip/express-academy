/** @type {import('./index.js').Exercise} */
export default {
  id: 'day17',
  title: 'Scheduled tasks and graceful shutdown',
  starter: `const express = require('express');
const app = express();

// TODO 1: a scheduled background job (in production: node-cron; here: setInterval):
//   let ticks = 0;
//   every 100ms -> ticks += 1
//   KEEP THE INTERVAL HANDLE in a variable — shutdown needs it.

// TODO 2: GET /work -> { "ok": true }         (represents normal traffic)

// TODO 3: GET /metrics -> { "ticks": ticks }  (observability endpoint)

// TODO 4: POST /admin/shutdown — begin a graceful shutdown:
//   - set a \`draining\` flag
//   - clearInterval(...) the scheduled job (never leave timers running in a
//     process that's going down)
//   - respond { "status": "draining" }

// TODO 5: a draining middleware registered BEFORE the routes:
//   - while draining, answer every request with 503 { "error": "server is shutting down" }
//     EXCEPT GET /metrics — health/observability endpoints stay up during a drain
//     so your orchestrator can watch the process die politely.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

let ticks = 0;
const metricsJob = setInterval(() => {
  ticks += 1;
}, 100);

let draining = false;

app.use((req, res, next) => {
  if (draining && req.path !== '/metrics') {
    return res.status(503).json({ error: 'server is shutting down' });
  }
  next();
});

app.get('/work', (req, res) => {
  res.json({ ok: true });
});

app.get('/metrics', (req, res) => {
  res.json({ ticks });
});

app.post('/admin/shutdown', (req, res) => {
  draining = true;
  clearInterval(metricsJob);
  res.json({ status: 'draining' });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// TODO 1: a scheduled background job (production: node-cron; here: setInterval):
//   let ticks = 0;
//   every 100ms -> ticks += 1
//   Keep the handle — its type is ReturnType<typeof setInterval>.

// TODO 2: GET /work -> { "ok": true }

// TODO 3: GET /metrics -> { "ticks": ticks }

// TODO 4: POST /admin/shutdown — graceful shutdown:
//   set a draining flag, clearInterval the job, respond { "status": "draining" }

// TODO 5: a draining middleware BEFORE the routes:
//   while draining -> 503 { "error": "server is shutting down" } for everything
//   EXCEPT GET /metrics (observability stays up during a drain).

export default app;
`,
  solutionTs: `import express, { type Request, type Response, type NextFunction } from 'express';

const app = express();

let ticks = 0;
const metricsJob: ReturnType<typeof setInterval> = setInterval(() => {
  ticks += 1;
}, 100);

let draining = false;

app.use((req: Request, res: Response, next: NextFunction) => {
  if (draining && req.path !== '/metrics') {
    return res.status(503).json({ error: 'server is shutting down' });
  }
  next();
});

app.get('/work', (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get('/metrics', (req: Request, res: Response) => {
  res.json({ ticks });
});

app.post('/admin/shutdown', (req: Request, res: Response) => {
  draining = true;
  clearInterval(metricsJob);
  res.json({ status: 'draining' });
});

export default app;
`,
  tests: [
    {
      name: 'Normal traffic works before the drain',
      request: { method: 'GET', path: '/work' },
      expect: { status: 200, json: { ok: true } },
    },
    {
      name: 'The scheduled job is ticking (≥2 ticks after 350ms)',
      request: { method: 'GET', path: '/metrics', delayMs: 350 },
      expect: { status: 200, jsonMin: { ticks: 2 } },
    },
    {
      name: 'POST /admin/shutdown starts draining',
      request: { method: 'POST', path: '/admin/shutdown' },
      expect: { status: 200, json: { status: 'draining' } },
    },
    {
      name: 'New traffic is refused with 503 while draining',
      request: { method: 'GET', path: '/work' },
      expect: { status: 503, json: { error: 'server is shutting down' } },
    },
    {
      name: 'But /metrics stays up during the drain',
      request: { method: 'GET', path: '/metrics' },
      expect: { status: 200, jsonHas: ['ticks'] },
      save: { frozenTicks: 'json.ticks' },
    },
    {
      name: 'The interval was really cleared — ticks stopped growing',
      request: { method: 'GET', path: '/metrics', delayMs: 300 },
      expect: { status: 200, json: { ticks: '{{frozenTicks}}' } },
    },
  ],
};

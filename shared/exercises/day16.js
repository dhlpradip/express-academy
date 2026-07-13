export default {
  id: 'day16',
  title: 'Background jobs and queues',
  starter: `const express = require('express');
const app = express();

app.use(express.json());

// ---- provided: a slow, unreliable email service (do not edit) -----------
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function sendWelcomeEmail(to) {
  await delay(150); // way too slow to make a user wait for
  if (to.includes('bounce')) throw new Error('mailbox unavailable');
}
// --------------------------------------------------------------------------

const jobs = new Map(); // id -> { id, status, attempts, error? }
let nextJobId = 1;

// TODO 1: POST /signups  body: { email }
//   - email must be a string containing "@", else 400 { "error": "valid email is required" }
//   - create a job { id, status: 'queued', attempts: 0 }, store it in the Map
//   - kick off processing in the background — CALL your process function
//     WITHOUT await — and respond IMMEDIATELY:
//       202 { "jobId": <id>, "status": "queued" }
//   (a test asserts the response arrives in <120ms while the email takes 150ms —
//    if you awaited, you fail)

// TODO 2: the background processor:
//   - try sendWelcomeEmail(email); success -> status 'completed'
//   - failure -> RETRY once (2 attempts total); still failing ->
//     status 'failed' and store err.message on the job
//   - track job.attempts (1 on first try, 2 after the retry)
//   - CRITICAL: this function must never throw/reject — there is no request
//     to attach an error to, and an unhandled rejection kills the process.
//     Catch everything inside.

// TODO 3: GET /jobs/:id -> the job object, or 404 { "error": "job not found" }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function sendWelcomeEmail(to) {
  await delay(150);
  if (to.includes('bounce')) throw new Error('mailbox unavailable');
}

const jobs = new Map();
let nextJobId = 1;

const MAX_ATTEMPTS = 2;

// Never throws: every failure path ends in a status update, not an exception.
async function processJob(job, email) {
  job.status = 'processing';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    job.attempts = attempt;
    try {
      await sendWelcomeEmail(email);
      job.status = 'completed';
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        job.status = 'failed';
        job.error = err.message;
      }
    }
  }
}

app.post('/signups', (req, res) => {
  const { email } = req.body || {};
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  const job = { id: String(nextJobId++), status: 'queued', attempts: 0 };
  jobs.set(job.id, job);

  processJob(job, email); // deliberately NOT awaited — fire and forget

  res.status(202).json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(job);
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();
app.use(express.json());

// ---- provided: a slow, unreliable email service (do not edit) -----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sendWelcomeEmail(to: string): Promise<void> {
  await delay(150); // way too slow to make a user wait for
  if (to.includes('bounce')) throw new Error('mailbox unavailable');
}
// --------------------------------------------------------------------------

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface Job {
  id: string;
  status: JobStatus;
  attempts: number;
  error?: string;
}

const jobs = new Map<string, Job>();
let nextJobId = 1;

// TODO 1: POST /signups  body: { email }
//   - email must be a string containing "@", else 400 { "error": "valid email is required" }
//   - create a Job { id, status: 'queued', attempts: 0 }, store it
//   - start processing WITHOUT await, respond IMMEDIATELY:
//       202 { "jobId": <id>, "status": "queued" }
//   (test asserts <120ms while the email takes 150ms — awaiting = failing)

// TODO 2: the background processor (Promise<void>, and it must NEVER reject):
//   - try sendWelcomeEmail; success -> 'completed'
//   - failure -> retry once (2 attempts total); still failing -> 'failed'
//     + store the error message (narrow the unknown catch var with instanceof)
//   - track job.attempts

// TODO 3: GET /jobs/:id -> the job, or 404 { "error": "job not found" }

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();
app.use(express.json());

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sendWelcomeEmail(to: string): Promise<void> {
  await delay(150);
  if (to.includes('bounce')) throw new Error('mailbox unavailable');
}

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface Job {
  id: string;
  status: JobStatus;
  attempts: number;
  error?: string;
}

const jobs = new Map<string, Job>();
let nextJobId = 1;

const MAX_ATTEMPTS = 2;

async function processJob(job: Job, email: string): Promise<void> {
  job.status = 'processing';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    job.attempts = attempt;
    try {
      await sendWelcomeEmail(email);
      job.status = 'completed';
      return;
    } catch (err: unknown) {
      if (attempt === MAX_ATTEMPTS) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'unknown failure';
      }
    }
  }
}

app.post('/signups', (req: Request, res: Response) => {
  const { email } = (req.body ?? {}) as { email?: unknown };
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'valid email is required' });
  }
  const job: Job = { id: String(nextJobId++), status: 'queued', attempts: 0 };
  jobs.set(job.id, job);

  void processJob(job, email); // \`void\` marks the promise as deliberately unawaited

  res.status(202).json({ jobId: job.id, status: 'queued' });
});

app.get('/jobs/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(job);
});

export default app;
`,
  tests: [
    {
      name: 'Enqueue responds 202 in <120ms — the 150ms email is NOT awaited',
      request: { method: 'POST', path: '/signups', json: { email: 'pradeep@varicon.com.au' } },
      expect: { status: 202, json: { status: 'queued' }, jsonHas: ['jobId'], maxMs: 120 },
      save: { jobId: 'json.jobId' },
    },
    {
      name: 'A moment later the job has completed (1 attempt)',
      request: { method: 'GET', path: '/jobs/{{jobId}}', delayMs: 400 },
      expect: { status: 200, json: { status: 'completed', attempts: 1 } },
    },
    {
      name: 'Garbage email is rejected up front with 400',
      request: { method: 'POST', path: '/signups', json: { email: 'not-an-email' } },
      expect: { status: 400, json: { error: 'valid email is required' } },
    },
    {
      name: 'A bouncing address still gets a 202 — failure happens later, in the background',
      request: { method: 'POST', path: '/signups', json: { email: 'bounce@dead.com' } },
      expect: { status: 202, jsonHas: ['jobId'] },
      save: { bounceId: 'json.jobId' },
    },
    {
      name: 'The bounced job retried once, then failed — with the error recorded',
      request: { method: 'GET', path: '/jobs/{{bounceId}}', delayMs: 650 },
      expect: { status: 200, json: { status: 'failed', attempts: 2 }, jsonHas: ['error'] },
    },
    {
      name: 'Unknown job ids are a 404',
      request: { method: 'GET', path: '/jobs/9999' },
      expect: { status: 404, json: { error: 'job not found' } },
    },
  ],
};

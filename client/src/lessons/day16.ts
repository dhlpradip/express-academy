import type { Lesson } from './types.ts';

export default {
  day: 16,
  id: 'day16',
  arc: 'Beyond the Request',
  minutes: 60,
  title: 'Background jobs and queues',
  summary: 'The 202 pattern, retries, and work that outlives the request',
  intro:
    'Some work is too slow, too flaky, or too unimportant-to-the-user to do inside a request: sending email, generating PDFs, resizing images, syncing to third-party APIs. The professional move is to **accept now, work later** — respond in milliseconds, process in the background, let the client poll for the outcome.',
  sections: [
    {
      h: 'The 202 pattern',
      p: [
        'HTTP has a status code built for this: **202 Accepted** — "I got your request, I have NOT done it yet." The flow: validate the input (validation stays synchronous — garbage should fail fast), create a job record with an id and `status: \'queued\'`, kick off processing **without awaiting it**, and respond immediately with the job id. The client then polls `GET /jobs/:id` — the same shape as tracking a delivery.',
        "You've been on the client side of this: any UI with a progress spinner polling a status endpoint. Now you build the server half, and the key line is the one where you deliberately *don't* write `await`.",
      ],
      code: `app.post('/signups', (req, res) => {
  // 1. validate synchronously — bad input fails NOW, not in the background
  const { email } = req.body || {};
  if (!isValid(email)) return res.status(400).json({ error: 'valid email is required' });

  // 2. record the job
  const job = { id: String(nextId++), status: 'queued', attempts: 0 };
  jobs.set(job.id, job);

  // 3. start the work — NO await. The request doesn't wait for the email.
  processJob(job, email);

  // 4. answer immediately
  res.status(202).json({ jobId: job.id, status: 'queued' });
});`,
      codeTitle: 'the-202-pattern.js',
    },
    {
      h: 'Background code must catch its own errors',
      p: [
        'Inside a handler, a thrown error has somewhere to go: the error middleware turns it into a 500. A background function has **no request attached** — if it rejects and nobody catches, that\'s an unhandled rejection, and depending on Node settings it kills the process. Every job you\'ve queued dies with it.',
        'So the iron rule: a background processor never throws. Every failure path ends in a *status update on the job record* (`status: \'failed\'`, `error: message`) — failure becomes data the client can read, instead of an exception nobody hears.',
        'Retries live here too: transient failures (network blips, rate limits) often succeed on a second attempt. Wrap the work in an attempt loop, record `attempts`, and only mark `failed` when the budget is spent.',
      ],
      note: 'In TypeScript, `void processJob(...)` is the idiomatic way to say "this promise is unawaited on purpose" — it silences the no-floating-promises lint rule that exists precisely to catch *accidental* fire-and-forget.',
    },
    {
      h: 'From here to BullMQ',
      p: [
        "Today's in-process version has a real weakness: the queue lives in your server's memory. Process restarts → queued jobs vanish; heavy jobs compete with request handling for CPU; two server instances can't share a queue. Production Node fixes all three with **BullMQ**: jobs are stored in Redis (they survive restarts), separate **worker processes** consume them (heavy work off the web server), and you get retries with exponential backoff, scheduling, and a dead-letter list for free.",
        "The shape of your code barely changes: `queue.add('welcome-email', { email })` where you called `processJob(...)`, and your processor function moves into a `Worker`. Everything you build today — job records, statuses, attempts, never-throw processors — is exactly the mental model BullMQ assumes you have.",
      ],
      code: `// The same thing with BullMQ, for when you go real (not needed today):
const queue = new Queue('emails', { connection: redis });

app.post('/signups', async (req, res) => {
  const job = await queue.add('welcome', { email }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  res.status(202).json({ jobId: job.id });
});

// separate worker process:
new Worker('emails', async (job) => {
  await sendWelcomeEmail(job.data.email); // throwing here = automatic retry
}, { connection: redis });`,
      codeTitle: 'bullmq-flavor.js',
    },
  ],
  exercise: {
    brief: [
      '`POST /signups` `{ email }` → invalid (not a string containing `@`) → 400 `{ "error": "valid email is required" }`; valid → create job `{ id, status: \'queued\', attempts: 0 }`, start processing WITHOUT await, respond **202** `{ "jobId", "status": "queued" }` — a test asserts <120ms while the email takes 150ms',
      'The processor: try `sendWelcomeEmail`; success → `completed`; failure → retry once (2 attempts total), then `failed` with the error message stored — and it must never throw',
      '`GET /jobs/:id` → the job object, or 404 `{ "error": "job not found" }`',
    ],
    hints: [
      'The whole trick is one missing keyword: call `processJob(job, email)` with no `await` in front',
      'An attempt loop reads cleanly: `for (let attempt = 1; attempt <= 2; attempt++) { try { ...; return } catch { ... } }`',
      'Set `job.attempts = attempt` inside the loop so the record always shows how many tries happened',
      "If you see the runner's 'unhandled promise rejection' error, your processor leaked an exception — the catch belongs INSIDE it",
    ],
  },
} satisfies Lesson;

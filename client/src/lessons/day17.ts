import type { Lesson } from './types.ts';

export default {
  day: 17,
  id: 'day17',
  arc: 'Beyond the Request',
  minutes: 55,
  title: 'Scheduled tasks and graceful shutdown',
  summary: 'Cron, recurring jobs, and how a server dies politely',
  intro:
    "The final class of backend work isn't triggered by any request at all: nightly cleanups, hourly report generation, minute-by-minute health metrics. And with it comes the skill nobody teaches but every deploy requires — shutting a server down without dropping the work it's holding.",
  sections: [
    {
      h: 'Cron: time as a trigger',
      p: [
        'Cron expressions are five fields — minute, hour, day-of-month, month, day-of-week — and they show up everywhere: crontab, GitHub Actions schedules, Kubernetes CronJobs, cloud schedulers. `0 3 * * *` = 03:00 daily; `*/15 * * * *` = every 15 minutes; `0 9 * * 1` = Mondays at 09:00. Learn to read them; you\'ll meet one this month.',
        'In Node the standard in-app tool is **node-cron**: give it an expression and a function. Under the hood it\'s a fancy `setInterval` — which is also why today\'s exercise uses a plain `setInterval` (100ms ticks): identical mechanics, testable in milliseconds instead of minutes.',
      ],
      code: `const cron = require('node-cron');

// every night at 03:00 — and note the day 16 rule still applies:
// scheduled code has no request either, so it catches its own errors.
cron.schedule('0 3 * * *', async () => {
  try {
    const deleted = await db.sessions.deleteExpired();
    logger.info(\`cleanup: removed \${deleted} expired sessions\`);
  } catch (err) {
    logger.error('cleanup failed', err);
  }
});`,
      codeTitle: 'nightly-cleanup.js',
      note: 'The multi-instance trap: node-cron runs inside your server process, so THREE server replicas = the job firing THREE times. Real deployments either run schedules in a dedicated single instance, use a distributed lock (Redis again), or move schedules out of the app entirely (Kubernetes CronJob hitting an endpoint). Interviewers love this question.',
    },
    {
      h: 'Graceful shutdown: how servers die politely',
      p: [
        'Every deploy kills your process. The platform sends **SIGTERM**, waits a grace period (typically 30s), then SIGKILLs. A naive process dies mid-request — users get connection resets, half-finished writes corrupt state. A graceful one **drains**: stop accepting new work, finish what\'s in flight, release resources, exit cleanly.',
        'The drain sequence: (1) flip a `draining` flag so new requests get **503** — load balancers read that as "send traffic elsewhere"; (2) stop timers and workers — `clearInterval`, close queue workers; (3) `server.close()` to finish in-flight requests; (4) close db/redis connections; (5) `process.exit(0)`. One deliberate exception: keep health/metrics endpoints answering during the drain, so your orchestrator can watch the death proceed.',
      ],
      code: `// The real thing — wire this into every production server you ship:
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  draining = true;              // new requests -> 503 (middleware checks this)
  clearInterval(metricsJob);    // stop scheduled work
  server.close(() => {          // waits for in-flight requests to finish
    db.end();                   // release connections
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // hard deadline
});`,
      codeTitle: 'graceful-shutdown.js',
    },
    {
      h: 'Today\'s exercise: the drain, observable',
      p: [
        "You'll build the whole lifecycle in miniature: a 100ms ticker (the scheduled job), a `/work` route (normal traffic), `/metrics` (observability), and a shutdown endpoint that flips the drain flag and clears the ticker. The tests then verify the three properties that matter: new work is refused with 503, metrics stay reachable, and — the subtle one — the ticker genuinely stopped. That last test reads the tick count, waits 300ms, and reads it again expecting the *same number*. A `clearInterval` you forgot is exactly the kind of leak that keeps real processes from ever exiting.",
        "That's the course. Seventeen days: the request cycle, then everything around it. The graduation project from day 14's roadmap still stands — rebuild the capstone with Prisma, real Redis, BullMQ, and a `docker-compose.yml`, and you'll have touched every piece of a production Node backend with your own hands.",
      ],
    },
  ],
  exercise: {
    brief: [
      'A scheduled job: `ticks` starts at 0, `setInterval` increments it every 100ms — keep the interval handle',
      '`GET /work` → `{ "ok": true }`; `GET /metrics` → `{ "ticks": <count> }`',
      '`POST /admin/shutdown` → set a draining flag, `clearInterval` the job, respond `{ "status": "draining" }`',
      'A draining middleware BEFORE the routes: while draining, everything answers 503 `{ "error": "server is shutting down" }` — EXCEPT `/metrics`, which stays up',
      'The final test proves the interval died: ticks must be identical 300ms apart',
    ],
    hints: [
      'Register the draining middleware first, but it only acts when the flag is set — normal traffic passes through untouched',
      'The exception in the middleware is one condition: `if (draining && req.path !== \'/metrics\')`',
      'Both the flag and the interval handle live in module scope — the closure-state pattern from day 3, one last time',
      'In TS the handle type is `ReturnType<typeof setInterval>` — works in both Node and browser typings',
    ],
  },
} satisfies Lesson;

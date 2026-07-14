import type { Lesson } from './types.ts';

export default {
  day: 6,
  id: 'day06',
  arc: 'Building APIs',
  minutes: 60,
  title: 'Errors that never crash the server',
  summary: 'Error middleware, the async trap, and the asyncHandler pattern',
  intro:
    "In React, an uncaught error breaks one component tree. On a server, an uncaught error can kill the process — for every user at once. Today you build the safety net: centralized error handling, plus the one Express 4 gotcha that catches every developer exactly once.",
  sections: [
    {
      h: 'Error-handling middleware',
      p: [
        'Express has a special middleware signature: **four arguments** — `(err, req, res, next)`. That arity is literally how Express identifies it as an error handler (a rare case of JavaScript caring how many parameters a function declares). Registered last, it becomes the single place where all failures turn into HTTP responses — think of it as the `ErrorBoundary` at the root of your tree.',
        'Two roads lead there: Express catches anything a handler **throws synchronously**, and you can send errors explicitly by calling **`next(err)`** — passing an argument to next() skips every remaining normal middleware and jumps straight to error handlers.',
      ],
      code: `app.get('/boom', (req, res) => {
  throw new Error('kaboom'); // sync throw — Express 4 catches this fine
});

// ...all routes above...

// 404 catch-all: plain middleware, runs only if nothing matched
app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

// error handler: LAST, and always with all four params
app.use((err, req, res, next) => {
  console.error(err); // in real apps: proper logging
  res.status(500).json({ error: err.message });
});`,
      codeTitle: 'safety-net.js',
    },
    {
      h: 'The async trap',
      p: [
        'Here is the gotcha: **Express 4 does not catch rejected promises.** An `async` handler that throws produces an unhandled rejection — the error never reaches your error middleware, the client hangs, and depending on Node settings the process dies. Since nearly every real handler awaits something (day 9: databases), this matters enormously.',
        'Fix one: try/catch in the handler and call `next(err)`. Fix two — the standard pattern — a tiny wrapper that does it for every async route:',
      ],
      code: `// Write this once per project (or npm install express-async-handler):
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/async-boom', asyncHandler(async (req, res) => {
  await Promise.reject(new Error('async kaboom'));
  // the rejection is caught and forwarded to your error middleware
}));`,
      codeTitle: 'async-handler.js',
      note: 'Express 5 (stable since late 2024) finally catches async rejections automatically. You still need to know this pattern — the majority of production codebases and tutorials are Express 4, and interviewers love this question. This course runs Express 4 on purpose.',
    },
    {
      h: 'The 404 catch-all',
      p: [
        'A plain `app.use((req, res) => ...)` registered after all routes only ever runs when nothing above matched — that\'s your JSON 404. Order recap for every Express app you\'ll ever write: parsers → routes → 404 → error handler.',
      ],
    },
  ],
  exercise: {
    brief: [
      '`GET /boom` → just `throw new Error(\'kaboom\')` synchronously',
      '`GET /async-boom` → an async handler where an awaited promise rejects with `Error(\'async kaboom\')` — caught via asyncHandler or try/catch + `next(err)`',
      'A 404 catch-all after all routes → `{ "error": "route not found" }`',
      'An error middleware last → 500 with `{ "error": err.message }`',
    ],
    hints: [
      'The error middleware MUST declare four params: `(err, req, res, next)` — even if you don\'t use next',
      'For the async route: `await Promise.reject(new Error(\'async kaboom\'))` inside the wrapped handler',
      'The asyncHandler from the lesson is three lines — type it out, don\'t copy; you\'ll write it in every project',
      'Order: routes, then 404, then error handler',
    ],
  },
  resources: [
    {
      title: "Express — Error handling guide",
      url: "https://expressjs.com/en/guide/error-handling.html",
      note: "the official word on the four-argument signature and the default handler",
    },
    {
      title: "Node.js Best Practices — error handling",
      url: "https://github.com/goldbergyoni/nodebestpractices",
      note: "the most-starred Node repo on GitHub; its error-handling section is industry consensus",
    },
    {
      title: "express-async-handler",
      url: "https://www.npmjs.com/package/express-async-handler",
      note: "the npm version of the wrapper you wrote — the whole package is ~10 lines",
    },
  ],
} satisfies Lesson;

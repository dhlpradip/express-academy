export default {
  id: 'day06',
  title: 'Errors that never crash the server',
  starter: `const express = require('express');
const app = express();

// TODO 1: GET /boom
//   -> just \`throw new Error('kaboom')\` synchronously inside the handler.
//   Express catches synchronous throws and forwards them to your error middleware.

// TODO 2: GET /async-boom
//   -> an async handler where \`Promise.reject(new Error('async kaboom'))\` is awaited
//      (or any rejecting await). In Express 4 this is NOT caught automatically —
//      you must try/catch and call next(err), or write an asyncHandler wrapper.

// TODO 3: a catch-all 404 handler AFTER all routes:
//   -> respond 404 with JSON { "error": "route not found" }

// TODO 4: an ERROR-HANDLING middleware LAST — the (err, req, res, next) signature:
//   -> respond 500 with JSON { "error": err.message }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

// A tiny wrapper that forwards async rejections to next() — write it once,
// use it on every async route. (Express 5 does this automatically.)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/boom', (req, res) => {
  throw new Error('kaboom');
});

app.get(
  '/async-boom',
  asyncHandler(async (req, res) => {
    await Promise.reject(new Error('async kaboom'));
  })
);

// 404: runs only if no route above matched.
app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

// Error handler: the four-argument signature is what marks it as one.
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// Useful types for this one:
//   import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
// The error middleware type is ErrorRequestHandler — or just write the 4 params.

// TODO 1: GET /boom -> throw new Error('kaboom') synchronously.

// TODO 2: GET /async-boom -> an async handler where an awaited promise rejects
//   with Error('async kaboom'). Express 4 does NOT catch this — write an
//   asyncHandler wrapper (great typing exercise) or try/catch + next(err).

// TODO 3: a catch-all 404 AFTER all routes -> { "error": "route not found" }

// TODO 4: an error middleware LAST: (err, req, res, next) ->
//   500 { "error": err.message }

export default app;
`,
  solutionTs: `import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';

const app = express();

// The classic wrapper, typed: takes an async handler, returns a normal one.
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

app.get('/boom', (req: Request, res: Response) => {
  throw new Error('kaboom');
});

app.get(
  '/async-boom',
  asyncHandler(async (req, res) => {
    await Promise.reject(new Error('async kaboom'));
  })
);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'route not found' });
});

// Four params = error middleware. TS type: ErrorRequestHandler.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

export default app;
`,
  tests: [
    {
      name: 'A synchronous throw becomes a clean 500 JSON response',
      request: { method: 'GET', path: '/boom' },
      expect: { status: 500, json: { error: 'kaboom' } },
    },
    {
      name: 'An async rejection is caught too (the hard part!)',
      request: { method: 'GET', path: '/async-boom' },
      expect: { status: 500, json: { error: 'async kaboom' } },
    },
    {
      name: 'Unknown routes get the JSON 404, not the HTML default',
      request: { method: 'GET', path: '/no-such-route' },
      expect: { status: 404, json: { error: 'route not found' } },
    },
    {
      name: 'The server survives all of that (still responding)',
      request: { method: 'GET', path: '/boom' },
      expect: { status: 500 },
    },
  ],
};

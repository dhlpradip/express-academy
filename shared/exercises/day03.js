export default {
  id: 'day03',
  title: 'Middleware: the assembly line',
  starter: `const express = require('express');
const app = express();

// TODO 1: write a "requestId" middleware, applied to EVERY request,
//   that sets a response header X-Request-Id with the value "req-<n>"
//   where <n> starts at 1 and increases by 1 for each request.
//   Hint: keep a counter variable outside the middleware function.

// TODO 2: GET /public -> respond with JSON { "message": "public ok" }

// TODO 3: write a "requireApiKey" middleware and apply it ONLY to /secret:
//   - if the request header "x-api-key" equals "letmein", call next()
//   - otherwise respond 401 with JSON { "error": "unauthorized" }

// TODO 4: GET /secret -> respond with JSON { "message": "secret ok" }
//   (protected by requireApiKey)

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

let counter = 0;
function requestId(req, res, next) {
  counter += 1;
  res.set('X-Request-Id', \`req-\${counter}\`);
  next();
}

function requireApiKey(req, res, next) {
  if (req.headers['x-api-key'] === 'letmein') {
    return next();
  }
  res.status(401).json({ error: 'unauthorized' });
}

app.use(requestId);

app.get('/public', (req, res) => {
  res.json({ message: 'public ok' });
});

app.get('/secret', requireApiKey, (req, res) => {
  res.json({ message: 'secret ok' });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// Middleware in TS gets the full signature:
//   (req: Request, res: Response, next: NextFunction) => void
// Import the types: import express, { type Request, type Response, type NextFunction } from 'express';

// TODO 1: a "requestId" middleware, applied to EVERY request,
//   setting header X-Request-Id to "req-<n>" (n = 1, 2, 3, ... per request).

// TODO 2: GET /public -> { "message": "public ok" }

// TODO 3: a "requireApiKey" middleware ONLY on /secret:
//   header "x-api-key" === "letmein" -> next(); else 401 { "error": "unauthorized" }

// TODO 4: GET /secret -> { "message": "secret ok" } (protected)

export default app;
`,
  solutionTs: `import express, { type Request, type Response, type NextFunction } from 'express';

const app = express();

let counter = 0;
function requestId(req: Request, res: Response, next: NextFunction): void {
  counter += 1;
  res.set('X-Request-Id', \`req-\${counter}\`);
  next();
}

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-api-key'] === 'letmein') {
    return next();
  }
  res.status(401).json({ error: 'unauthorized' });
}

app.use(requestId);

app.get('/public', (req: Request, res: Response) => {
  res.json({ message: 'public ok' });
});

app.get('/secret', requireApiKey, (req: Request, res: Response) => {
  res.json({ message: 'secret ok' });
});

export default app;
`,
  tests: [
    {
      name: 'GET /public works and carries an X-Request-Id header',
      request: { method: 'GET', path: '/public' },
      expect: { status: 200, json: { message: 'public ok' }, headers: { 'x-request-id': 'req-' } },
    },
    {
      name: 'GET /secret without a key is rejected with 401',
      request: { method: 'GET', path: '/secret' },
      expect: { status: 401, json: { error: 'unauthorized' } },
    },
    {
      name: 'Rejected requests STILL have X-Request-Id (middleware order matters)',
      request: { method: 'GET', path: '/secret' },
      expect: { status: 401, headers: { 'x-request-id': 'req-' } },
    },
    {
      name: 'GET /secret with x-api-key: letmein gets through',
      request: { method: 'GET', path: '/secret', headers: { 'x-api-key': 'letmein' } },
      expect: { status: 200, json: { message: 'secret ok' } },
    },
    {
      name: 'The wrong key is still rejected',
      request: { method: 'GET', path: '/secret', headers: { 'x-api-key': 'password123' } },
      expect: { status: 401 },
    },
  ],
};

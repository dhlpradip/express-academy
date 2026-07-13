export default {
  id: 'day11',
  title: 'CORS and rate limiting, by hand',
  starter: `const express = require('express');
const app = express();

const ALLOWED_ORIGIN = 'http://localhost:5173';

// TODO 1: a CORS middleware, applied to every request:
//   - read the request's "Origin" header
//   - if it equals ALLOWED_ORIGIN, set the response header
//       Access-Control-Allow-Origin: <that origin>
//     (if the origin doesn't match, set NOTHING — that's how CORS "blocks")
//   - if the request method is OPTIONS (the preflight), ALSO set:
//       Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
//       Access-Control-Allow-Headers: Content-Type, Authorization
//     ...and end the response with status 204 (no body, don't call next())
//   - otherwise call next()

// TODO 2: a rateLimit middleware applied ONLY to the GET /data route:
//   - count calls in a variable; allow the first 3 requests
//   - from the 4th request on -> 429 { "error": "too many requests" }

// TODO 3: GET /data -> { "data": "sensitive" } (rate-limited)

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

const ALLOWED_ORIGIN = 'http://localhost:5173';

function corsMiddleware(req, res, next) {
  if (req.headers.origin === ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  next();
}

let hits = 0;
function rateLimit(req, res, next) {
  hits += 1;
  if (hits > 3) {
    return res.status(429).json({ error: 'too many requests' });
  }
  next();
}

app.use(corsMiddleware);

app.get('/data', rateLimit, (req, res) => {
  res.json({ data: 'sensitive' });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

const ALLOWED_ORIGIN = 'http://localhost:5173';

// TODO 1: a CORS middleware on every request:
//   - if req.headers.origin === ALLOWED_ORIGIN, set
//       Access-Control-Allow-Origin: <that origin>
//     (non-matching origin: set NOTHING — that's how CORS "blocks")
//   - if req.method === 'OPTIONS' (the preflight), ALSO set:
//       Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
//       Access-Control-Allow-Headers: Content-Type, Authorization
//     ...and end with status 204 (no body, no next())
//   - otherwise next()

// TODO 2: a rateLimit middleware ONLY on GET /data:
//   allow the first 3 requests; then 429 { "error": "too many requests" }

// TODO 3: GET /data -> { "data": "sensitive" } (rate-limited)

export default app;
`,
  solutionTs: `import express, { type Request, type Response, type NextFunction } from 'express';

const app = express();

const ALLOWED_ORIGIN = 'http://localhost:5173';

function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.headers.origin === ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }
  next();
}

let hits = 0;
function rateLimit(req: Request, res: Response, next: NextFunction): void {
  hits += 1;
  if (hits > 3) {
    res.status(429).json({ error: 'too many requests' });
    return;
  }
  next();
}

app.use(corsMiddleware);

app.get('/data', rateLimit, (req: Request, res: Response) => {
  res.json({ data: 'sensitive' });
});

export default app;
`,
  tests: [
    {
      name: 'An allowed origin gets Access-Control-Allow-Origin back',
      request: { method: 'GET', path: '/data', headers: { origin: 'http://localhost:5173' } },
      expect: { status: 200, json: { data: 'sensitive' }, headers: { 'access-control-allow-origin': 'http://localhost:5173' } },
    },
    {
      name: 'The OPTIONS preflight gets 204 + methods + headers',
      request: { method: 'OPTIONS', path: '/data', headers: { origin: 'http://localhost:5173' } },
      expect: {
        status: 204,
        headers: {
          'access-control-allow-methods': 'GET',
          'access-control-allow-headers': 'Content-Type',
        },
      },
    },
    {
      name: 'A disallowed origin gets NO Access-Control-Allow-Origin header',
      request: { method: 'GET', path: '/data', headers: { origin: 'http://evil.example.com' } },
      expect: { status: 200, headerMissing: ['access-control-allow-origin'] },
    },
    {
      name: 'The 4th GET /data is rate-limited with 429',
      request: { method: 'GET', path: '/data', repeat: 2 },
      expect: { status: 429, json: { error: 'too many requests' } },
    },
    {
      name: 'Preflights are NOT counted against the limit (still 204)',
      request: { method: 'OPTIONS', path: '/data', headers: { origin: 'http://localhost:5173' } },
      expect: { status: 204 },
    },
  ],
};

/** @type {import('./index.js').Exercise} */
export default {
  id: 'day18',
  title: 'Docker-shaped apps: config from the environment',
  starter: `const express = require('express');
const app = express();

// A containerized app receives ALL of its configuration from environment
// variables — that's how Docker, Kubernetes, and every PaaS inject config.
// The test runner sets these for you (like docker run -e KEY=value):
//
//   APP_VERSION   = "2.1.0"
//   NODE_ENV      = "production"
//   DATABASE_URL  = "postgresql://admin:s3cret@db.internal:5432/app"

// TODO 1: read them ONCE at module level from process.env.

// TODO 2: GET /healthz -> { "status": "ok", "version": <APP_VERSION> }
//   (the endpoint Docker's HEALTHCHECK and k8s probes will poll)

// TODO 3: GET /config -> { "env": <NODE_ENV>, "databaseHost": <host> }
//   - parse the host with: new URL(DATABASE_URL).hostname
//   - CRITICAL: the password must NEVER appear in any response.
//     A test scans the body for "s3cret" and fails you if it leaks.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

const APP_VERSION = process.env.APP_VERSION || 'dev';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || '';

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', version: APP_VERSION });
});

app.get('/config', (req, res) => {
  const parsed = new URL(DATABASE_URL);
  // Expose only what an operator needs to see — never credentials.
  res.json({ env: NODE_ENV, databaseHost: parsed.hostname });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// A containerized app receives ALL of its configuration from environment
// variables. The test runner sets these (like docker run -e KEY=value):
//
//   APP_VERSION   = "2.1.0"
//   NODE_ENV      = "production"
//   DATABASE_URL  = "postgresql://admin:s3cret@db.internal:5432/app"

// TODO 1: read them ONCE at module level from process.env
//   (process.env values are typed string | undefined — handle it: ?? 'dev')

// TODO 2: GET /healthz -> { "status": "ok", "version": <APP_VERSION> }

// TODO 3: GET /config -> { "env": <NODE_ENV>, "databaseHost": <host> }
//   - new URL(DATABASE_URL).hostname
//   - the password must NEVER appear in any response (a test scans for it)

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

const APP_VERSION = process.env.APP_VERSION ?? 'dev';
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const DATABASE_URL = process.env.DATABASE_URL ?? '';

app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: APP_VERSION });
});

app.get('/config', (req: Request, res: Response) => {
  const parsed = new URL(DATABASE_URL);
  res.json({ env: NODE_ENV, databaseHost: parsed.hostname });
});

export default app;
`,
  env: {
    APP_VERSION: '2.1.0',
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://admin:s3cret@db.internal:5432/app',
  },
  tests: [
    {
      name: 'GET /healthz reports the injected version',
      request: { method: 'GET', path: '/healthz' },
      expect: { status: 200, json: { status: 'ok', version: '2.1.0' } },
    },
    {
      name: 'GET /config reads the environment',
      request: { method: 'GET', path: '/config' },
      expect: { status: 200, json: { env: 'production', databaseHost: 'db.internal' } },
    },
    {
      name: 'THE LEAK TEST: the database password never appears in /config',
      request: { method: 'GET', path: '/config' },
      expect: { status: 200, bodyLacks: ['s3cret', 'admin:'] },
    },
    {
      name: '...and not in /healthz either',
      request: { method: 'GET', path: '/healthz' },
      expect: { status: 200, bodyLacks: 's3cret' },
    },
  ],
};

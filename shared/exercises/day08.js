/** @type {import('./index.js').Exercise} */
export default {
  id: 'day08',
  title: 'Routers: structure for real projects',
  starter: `const express = require('express');
const app = express();

const users = [
  { id: 1, name: 'alice' },
  { id: 2, name: 'bob' },
];

// TODO 1: create an "apiVersion" middleware that sets the response header
//   X-Api-Version to "1", and apply it to EVERYTHING mounted under /api.
//   Hint: app.use('/api', apiVersion)

// TODO 2: create a usersRouter with express.Router():
//   GET /          -> the full users array
//   GET /:id       -> the matching user, or 404 { "error": "not found" }
//   ...and mount it at /api/users

// TODO 3: create a healthRouter:
//   GET /          -> { "status": "ok" }
//   ...and mount it at /api/health

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

const users = [
  { id: 1, name: 'alice' },
  { id: 2, name: 'bob' },
];

function apiVersion(req, res, next) {
  res.set('X-Api-Version', '1');
  next();
}

const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {
  res.json(users);
});

usersRouter.get('/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiVersion);
app.use('/api/users', usersRouter);
app.use('/api/health', healthRouter);

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'alice' },
  { id: 2, name: 'bob' },
];

// TODO 1: an "apiVersion" middleware setting header X-Api-Version: "1",
//   applied to EVERYTHING under /api (hint: app.use('/api', apiVersion)).

// TODO 2: a usersRouter (express.Router()):
//   GET /     -> the users array
//   GET /:id  -> the user, or 404 { "error": "not found" }
//   ...mounted at /api/users

// TODO 3: a healthRouter: GET / -> { "status": "ok" }, mounted at /api/health

export default app;
`,
  solutionTs: `import express, { type Request, type Response, type NextFunction, Router } from 'express';

const app = express();

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'alice' },
  { id: 2, name: 'bob' },
];

function apiVersion(req: Request, res: Response, next: NextFunction): void {
  res.set('X-Api-Version', '1');
  next();
}

const usersRouter = Router();

usersRouter.get('/', (req: Request, res: Response) => {
  res.json(users);
});

usersRouter.get('/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiVersion);
app.use('/api/users', usersRouter);
app.use('/api/health', healthRouter);

export default app;
`,
  tests: [
    {
      name: 'GET /api/users lists both seeded users',
      request: { method: 'GET', path: '/api/users' },
      expect: { status: 200, jsonLength: 2, json: [{ id: 1, name: 'alice' }, { id: 2, name: 'bob' }] },
    },
    {
      name: 'GET /api/users/1 finds alice',
      request: { method: 'GET', path: '/api/users/1' },
      expect: { status: 200, json: { id: 1, name: 'alice' } },
    },
    {
      name: 'GET /api/users/999 is a 404',
      request: { method: 'GET', path: '/api/users/999' },
      expect: { status: 404, json: { error: 'not found' } },
    },
    {
      name: 'GET /api/health reports ok',
      request: { method: 'GET', path: '/api/health' },
      expect: { status: 200, json: { status: 'ok' } },
    },
    {
      name: 'The version header applies to the whole /api prefix',
      request: { method: 'GET', path: '/api/users' },
      expect: { headers: { 'x-api-version': '1' } },
    },
    {
      name: '...including /api/health',
      request: { method: 'GET', path: '/api/health' },
      expect: { headers: { 'x-api-version': '1' } },
    },
    {
      name: 'Routes outside /api are untouched (no version header)',
      request: { method: 'GET', path: '/' },
      expect: { headerMissing: ['x-api-version'] },
    },
  ],
};

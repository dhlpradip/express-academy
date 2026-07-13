export default {
  id: 'day10',
  title: 'Authentication with JWT',
  starter: `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret'; // in real life: process.env.JWT_SECRET
const users = new Map(); // username -> { username, passwordHash }

// TODO 1: POST /auth/register  body: { username, password }
//   - if the username is already taken -> 409 { "error": "username taken" }
//   - hash the password with bcrypt.hashSync(password, 10) — NEVER store it raw
//   - store the user, respond 201 { "username": ... }  (no hash in the response!)

// TODO 2: POST /auth/login  body: { username, password }
//   - unknown user OR bcrypt.compareSync fails -> 401 { "error": "invalid credentials" }
//   - success -> jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' })
//     respond { "token": ... }

// TODO 3: a requireAuth middleware:
//   - read the "Authorization" header, expect the format "Bearer <token>"
//   - verify with jwt.verify(token, JWT_SECRET) inside try/catch
//   - valid   -> put the payload on req.user, call next()
//   - anything wrong -> 401 { "error": "unauthorized" }

// TODO 4: GET /me (protected by requireAuth)
//   -> respond { "username": req.user.username }

module.exports = app;
`,
  solution: `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';
const users = new Map();

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  if (users.has(username)) {
    return res.status(409).json({ error: 'username taken' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  users.set(username, { username, passwordHash });
  res.status(201).json({ username });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.get(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

app.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = app;
`,
  starterTs: `import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret'; // in real life: process.env.JWT_SECRET

interface User {
  username: string;
  passwordHash: string;
}
const users = new Map<string, User>();

// The standard TS trick for auth: extend Request so req.user is typed.
interface AuthedRequest extends express.Request {
  user?: { username: string };
}

// TODO 1: POST /auth/register  { username, password }
//   - taken username -> 409 { "error": "username taken" }
//   - hash with bcrypt.hashSync(password, 10), store, 201 { "username" }

// TODO 2: POST /auth/login  { username, password }
//   - bad user or password -> 401 { "error": "invalid credentials" }
//   - success -> { "token": jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' }) }

// TODO 3: requireAuth middleware — parse "Bearer <token>", jwt.verify in
//   try/catch, put the payload on req.user, else 401 { "error": "unauthorized" }
//   (jwt.verify returns string | JwtPayload — cast: as { username: string })

// TODO 4: GET /me (protected) -> { "username": req.user.username }

export default app;
`,
  solutionTs: `import express, { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';

interface User {
  username: string;
  passwordHash: string;
}
const users = new Map<string, User>();

interface AuthedRequest extends Request {
  user?: { username: string };
}

app.post('/auth/register', (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (users.has(username)) {
    return res.status(409).json({ error: 'username taken' });
  }
  users.set(username, { username, passwordHash: bcrypt.hashSync(password, 10) });
  res.status(201).json({ username });
});

app.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const user = username ? users.get(username) : undefined;
  if (!user || !password || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as { username: string };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

app.get('/me', requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ username: req.user!.username });
});

export default app;
`,
  tests: [
    {
      name: 'POST /auth/register creates a user (and never leaks the password)',
      request: { method: 'POST', path: '/auth/register', json: { username: 'pradeep', password: 'hunter22' } },
      expect: { status: 201, json: { username: 'pradeep' } },
    },
    {
      name: 'Registering the same username again is a 409 conflict',
      request: { method: 'POST', path: '/auth/register', json: { username: 'pradeep', password: 'other' } },
      expect: { status: 409, json: { error: 'username taken' } },
    },
    {
      name: 'Logging in with the wrong password is a 401',
      request: { method: 'POST', path: '/auth/login', json: { username: 'pradeep', password: 'wrong' } },
      expect: { status: 401, json: { error: 'invalid credentials' } },
    },
    {
      name: 'Logging in with the right password returns a token',
      request: { method: 'POST', path: '/auth/login', json: { username: 'pradeep', password: 'hunter22' } },
      expect: { status: 200, jsonHas: ['token'] },
      save: { token: 'json.token' },
    },
    {
      name: 'GET /me with the Bearer token identifies you',
      request: { method: 'GET', path: '/me', headers: { authorization: 'Bearer {{token}}' } },
      expect: { status: 200, json: { username: 'pradeep' } },
    },
    {
      name: 'GET /me with no token is a 401',
      request: { method: 'GET', path: '/me' },
      expect: { status: 401, json: { error: 'unauthorized' } },
    },
    {
      name: 'GET /me with a forged token is a 401',
      request: { method: 'GET', path: '/me', headers: { authorization: 'Bearer not.a.realtoken' } },
      expect: { status: 401, json: { error: 'unauthorized' } },
    },
  ],
};

export default {
  id: 'day07',
  title: 'Validate everything that crosses the wire',
  starter: `const express = require('express');
const app = express();

app.use(express.json());

// TODO: POST /signup — validate the body and collect ALL problems, not just the first.
//
// Rules:
//   username — required, string, 3 to 20 characters
//   email    — required, string, must contain "@"
//   age      — OPTIONAL, but if present must be a number >= 13
//
// If anything is invalid:
//   -> 400 with JSON { "errors": [ ...one message per problem... ] }
//   -> each message MUST mention the field name (e.g. "username must be...")
//
// If everything is valid:
//   -> 201 with JSON { "username": ..., "email": ... }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

function validateSignup(body) {
  const errors = [];
  const { username, email, age } = body;

  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    errors.push('username must be a string of 3 to 20 characters');
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    errors.push('email must be a valid email address');
  }
  if (age !== undefined && (typeof age !== 'number' || age < 13)) {
    errors.push('age must be a number of at least 13');
  }
  return errors;
}

app.post('/signup', (req, res) => {
  const errors = validateSignup(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  res.status(201).json({ username: req.body.username, email: req.body.email });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();
app.use(express.json());

// TODO: POST /signup — validate the body, collect ALL problems.
//
// Rules:
//   username — required, string, 3 to 20 characters
//   email    — required, string, must contain "@"
//   age      — OPTIONAL, but if present a number >= 13
//
// Invalid -> 400 { "errors": [ ...one message per problem, naming the field... ] }
// Valid   -> 201 { "username": ..., "email": ... }
//
// TS angle: req.body is \`any\` — the honest type for it is unknown data.
// Treat it as Record<string, unknown> and let typeof checks narrow each field;
// this is exactly what zod's safeParse automates.

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();
app.use(express.json());

function validateSignup(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const { username, email, age } = body;

  // Each typeof check both validates AND narrows the type for TS.
  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    errors.push('username must be a string of 3 to 20 characters');
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    errors.push('email must be a valid email address');
  }
  if (age !== undefined && (typeof age !== 'number' || age < 13)) {
    errors.push('age must be a number of at least 13');
  }
  return errors;
}

app.post('/signup', (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const errors = validateSignup(body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  res.status(201).json({ username: body.username, email: body.email });
});

export default app;
`,
  tests: [
    {
      name: 'A valid signup is accepted with 201',
      request: { method: 'POST', path: '/signup', json: { username: 'pradeep', email: 'p@varicon.com' } },
      expect: { status: 201, json: { username: 'pradeep', email: 'p@varicon.com' } },
    },
    {
      name: 'A valid signup with age works too',
      request: { method: 'POST', path: '/signup', json: { username: 'pradeep', email: 'p@varicon.com', age: 30 } },
      expect: { status: 201 },
    },
    {
      name: 'Bad username AND bad email are BOTH reported (collect, don’t bail)',
      request: { method: 'POST', path: '/signup', json: { username: 'ab', email: 'not-an-email' } },
      expect: { status: 400, jsonHas: ['errors'], bodyContains: ['username', 'email'] },
    },
    {
      name: 'A 12-year-old is politely refused',
      request: { method: 'POST', path: '/signup', json: { username: 'younguser', email: 'kid@mail.com', age: 12 } },
      expect: { status: 400, bodyContains: 'age' },
    },
    {
      name: 'age sent as a string is invalid (types matter)',
      request: { method: 'POST', path: '/signup', json: { username: 'someuser', email: 'a@b.com', age: '25' } },
      expect: { status: 400, bodyContains: 'age' },
    },
    {
      name: 'An empty body reports the missing required fields',
      request: { method: 'POST', path: '/signup', json: {} },
      expect: { status: 400, bodyContains: ['username', 'email'] },
    },
  ],
};

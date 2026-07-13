/** @type {import('./index.js').Exercise} */
export default {
  id: 'day02',
  title: 'Routing: params and query strings',
  starter: `const express = require('express');
const app = express();

// TODO 1: GET /greet/:name
//   -> respond with JSON: { "message": "Hello, <name>!" }

// TODO 2: GET /search
//   -> if the "q" query param is present, respond with JSON:
//        { "query": "<q>", "results": [] }
//   -> if "q" is missing, respond 400 with JSON:
//        { "error": "q is required" }

// TODO 3: GET /users/:id/posts/:postId
//   -> respond with JSON: { "userId": "<id>", "postId": "<postId>" }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.get('/greet/:name', (req, res) => {
  res.json({ message: \`Hello, \${req.params.name}!\` });
});

app.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'q is required' });
  }
  res.json({ query: q, results: [] });
});

app.get('/users/:id/posts/:postId', (req, res) => {
  res.json({ userId: req.params.id, postId: req.params.postId });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// TODO 1: GET /greet/:name
//   -> respond with JSON: { "message": "Hello, <name>!" }

// TODO 2: GET /search
//   -> if the "q" query param is a non-empty string, respond with JSON:
//        { "query": "<q>", "results": [] }
//   -> otherwise respond 400 with JSON: { "error": "q is required" }
//   TS bonus: req.query.q is typed string | string[] | undefined (and more) —
//   narrow it with typeof before using it.

// TODO 3: GET /users/:id/posts/:postId
//   -> respond with JSON: { "userId": "<id>", "postId": "<postId>" }

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

app.get('/greet/:name', (req: Request, res: Response) => {
  res.json({ message: \`Hello, \${req.params.name}!\` });
});

app.get('/search', (req: Request, res: Response) => {
  const q = req.query.q;
  // Narrowing: q could be string, string[], or undefined — TS makes you handle it.
  if (typeof q !== 'string' || q === '') {
    return res.status(400).json({ error: 'q is required' });
  }
  res.json({ query: q, results: [] });
});

app.get('/users/:id/posts/:postId', (req: Request, res: Response) => {
  res.json({ userId: req.params.id, postId: req.params.postId });
});

export default app;
`,
  tests: [
    {
      name: 'GET /greet/Pradeep greets by name',
      request: { method: 'GET', path: '/greet/Pradeep' },
      expect: { status: 200, json: { message: 'Hello, Pradeep!' } },
    },
    {
      name: 'GET /greet/:name works for any name',
      request: { method: 'GET', path: '/greet/Ada' },
      expect: { status: 200, json: { message: 'Hello, Ada!' } },
    },
    {
      name: 'GET /search?q=express echoes the query',
      request: { method: 'GET', path: '/search?q=express' },
      expect: { status: 200, json: { query: 'express', results: [] } },
    },
    {
      name: 'GET /search without q responds 400',
      request: { method: 'GET', path: '/search' },
      expect: { status: 400, json: { error: 'q is required' } },
    },
    {
      name: 'Nested params: GET /users/7/posts/42 (note: params are strings!)',
      request: { method: 'GET', path: '/users/7/posts/42' },
      expect: { status: 200, json: { userId: '7', postId: '42' } },
    },
  ],
};

/** @type {import('./index.js').Exercise} */
export default {
  id: 'day01',
  title: 'Your first Express server',
  starter: `const express = require('express');
const app = express();

// TODO 1: handle GET / and respond with the text "Hello, Express!"

// TODO 2: handle GET /about and respond with a sentence
//         that contains the word "backend"

// Don't call app.listen() — the test runner starts the server for you.
module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/about', (req, res) => {
  res.send('I am a React developer becoming a backend developer.');
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// TODO 1: handle GET / and respond with the text "Hello, Express!"

// TODO 2: handle GET /about and respond with a sentence
//         that contains the word "backend"

// Don't call app.listen() — the test runner starts the server for you.
export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express!');
});

app.get('/about', (req: Request, res: Response) => {
  res.send('I am a React developer becoming a backend developer.');
});

export default app;
`,
  tests: [
    {
      name: 'GET / responds with "Hello, Express!"',
      request: { method: 'GET', path: '/' },
      expect: { status: 200, bodyContains: 'Hello, Express!' },
    },
    {
      name: 'GET /about mentions the backend',
      request: { method: 'GET', path: '/about' },
      expect: { status: 200, bodyContains: 'backend' },
    },
    {
      name: 'Unknown routes still 404 (Express handles this for you)',
      request: { method: 'GET', path: '/definitely-not-a-route' },
      expect: { status: 404 },
    },
  ],
};

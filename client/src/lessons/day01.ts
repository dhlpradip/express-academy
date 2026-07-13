import type { Lesson } from './types.ts';

export default {
  day: 1,
  id: 'day01',
  arc: 'Foundations',
  minutes: 40,
  title: 'Your first Express server',
  summary: 'What a server actually is, the request/response cycle, and your first routes',
  intro:
    "You've spent five years on the side of HTTP that *sends* requests. Today you switch chairs: you are now the code that *answers* them. Everything in backend development builds on one loop — a request comes in, your code runs, a response goes out.",
  sections: [
    {
      h: 'The mental model shift',
      p: [
        'A React app is a long-lived UI that re-renders as state changes. A server is different: it is a long-lived **process** that sits idle until a request arrives, runs a function for that one request, sends back a response, and forgets almost everything. No virtual DOM, no re-renders — just functions triggered by HTTP.',
        'The closest React analogy: a route handler is like an event handler. `app.get(\'/todos\', handler)` reads as "when a GET event for /todos happens, run this function" — the same shape as `onClick={handler}`, but the event source is the network.',
      ],
    },
    {
      h: 'What Node gives you, and what Express adds',
      p: [
        "Node's built-in `http` module can already run a server, but it hands you a raw request and leaves you to parse URLs, methods, bodies, and headers by hand. It's worth seeing once, so you know what Express is saving you from:",
      ],
      code: `const http = require('node:http');

const server = http.createServer((req, res) => {
  // ONE function for EVERY request — you branch manually
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from raw Node');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000);`,
      codeTitle: 'raw-node.js — what life looks like without Express',
    },
    {
      h: 'The same thing in Express',
      p: [
        'Express is a thin routing-and-middleware layer over that raw server. Instead of one giant if/else, you declare a handler per method + path, and Express does the matching:',
      ],
      code: `const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' }); // sets Content-Type: application/json for you
});

app.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});`,
      codeTitle: 'server.js',
    },
    {
      h: 'Anatomy of a route handler',
      p: [
        'Every handler receives two objects. `req` is everything about the incoming request: URL, headers, query string, body. `res` is your toolkit for answering: `res.send(text)`, `res.json(object)`, `res.status(code)`. If you never call one of the sending methods, the client hangs forever waiting — a classic day-one bug.',
        'One more thing that surprises frontend developers: any route you *haven\'t* declared automatically gets a `404 Not Found` from Express. Sensible defaults everywhere.',
      ],
      note: 'In this course you never call `app.listen()` in exercises — you end each file with `module.exports = app;` (JS mode) or `export default app;` (TS mode) and the test runner starts the server on a free port. This is exactly how real Express apps are structured for testing (supertest does the same thing). Speaking of modes: every exercise has a **JS / TS toggle** — do it in JavaScript first, then again in TypeScript for double the reps.',
    },
  ],
  exercise: {
    brief: [
      'Handle `GET /` and respond with the exact text `Hello, Express!`',
      'Handle `GET /about` and respond with any sentence containing the word `backend`',
      'Leave the `module.exports = app;` line in place — the runner needs it',
    ],
    hints: [
      'The pattern is `app.get(\'/path\', (req, res) => { ... })`',
      '`res.send(\'some text\')` sends a plain-text response with status 200',
      'You need two separate `app.get()` calls, one per path',
    ],
  },
} satisfies Lesson;

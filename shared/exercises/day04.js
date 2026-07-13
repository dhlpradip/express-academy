export default {
  id: 'day04',
  title: 'Request in, response out',
  starter: `const express = require('express');
const app = express();

// Remember: to read JSON request bodies you need the express.json() middleware.

// TODO 1: POST /echo
//   -> respond with status 201 and JSON:
//      {
//        "youSent": <the parsed request body>,
//        "contentType": <the request's content-type header>
//      }

// TODO 2: GET /teapot
//   -> respond with status 418 and a body containing the word "teapot"

// TODO 3: GET /headers
//   -> set a response header "X-Powered-By-Me" with value "express-academy"
//   -> respond with JSON { "ok": true }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

app.post('/echo', (req, res) => {
  res.status(201).json({
    youSent: req.body,
    contentType: req.headers['content-type'],
  });
});

app.get('/teapot', (req, res) => {
  res.status(418).send("I'm a teapot, not a coffee machine.");
});

app.get('/headers', (req, res) => {
  res.set('X-Powered-By-Me', 'express-academy');
  res.json({ ok: true });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// Remember: to read JSON request bodies you need the express.json() middleware.

// TODO 1: POST /echo
//   -> status 201 and JSON:
//      { "youSent": <the parsed body>, "contentType": <the request's content-type header> }

// TODO 2: GET /teapot
//   -> status 418 with a body containing the word "teapot"

// TODO 3: GET /headers
//   -> set header "X-Powered-By-Me": "express-academy", respond { "ok": true }

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

app.use(express.json());

app.post('/echo', (req: Request, res: Response) => {
  res.status(201).json({
    youSent: req.body,
    contentType: req.headers['content-type'],
  });
});

app.get('/teapot', (req: Request, res: Response) => {
  res.status(418).send("I'm a teapot, not a coffee machine.");
});

app.get('/headers', (req: Request, res: Response) => {
  res.set('X-Powered-By-Me', 'express-academy');
  res.json({ ok: true });
});

export default app;
`,
  tests: [
    {
      name: 'POST /echo parses the JSON body and responds 201',
      request: { method: 'POST', path: '/echo', json: { ping: 'pong', nested: { n: 1 } } },
      expect: { status: 201, json: { youSent: { ping: 'pong', nested: { n: 1 } } }, jsonHas: ['contentType'] },
    },
    {
      name: 'POST /echo reports the content-type it received',
      request: { method: 'POST', path: '/echo', json: { a: 1 } },
      expect: { status: 201, bodyContains: 'application/json' },
    },
    {
      name: 'GET /teapot responds 418 with a teapot in the body',
      request: { method: 'GET', path: '/teapot' },
      expect: { status: 418, bodyContains: 'teapot' },
    },
    {
      name: 'GET /headers sets the custom header',
      request: { method: 'GET', path: '/headers' },
      expect: { status: 200, json: { ok: true }, headers: { 'x-powered-by-me': 'express-academy' } },
    },
  ],
};

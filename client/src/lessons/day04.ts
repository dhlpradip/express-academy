import type { Lesson } from './types.ts';

export default {
  day: 4,
  id: 'day04',
  arc: 'Foundations',
  minutes: 45,
  title: 'Request in, response out',
  summary: 'Bodies, headers, and status codes — speaking fluent HTTP',
  intro:
    "You've called `res.json()` from fetch a thousand times. Today you build the other end: parsing what clients send you and answering with precise status codes and headers. Being fluent here is what separates 'it works' APIs from professional ones.",
  sections: [
    {
      h: 'Reading the body',
      p: [
        'HTTP bodies arrive as a raw byte stream — Express does not parse them unless you ask. `app.use(express.json())` installs the parser: for requests with `Content-Type: application/json` it reads the stream, parses it, and puts the result on `req.body`. Forget the middleware and `req.body` is `undefined` — the single most common Express beginner bug.',
      ],
      code: `app.use(express.json()); // once, near the top

app.post('/messages', (req, res) => {
  const { text } = req.body; // already a plain JS object
  res.status(201).json({ received: text });
});`,
      codeTitle: 'body.js',
      note: 'There are sibling parsers for other formats: `express.urlencoded()` for classic HTML form posts and `express.raw()` for binary. JSON covers almost everything in API work.',
    },
    {
      h: 'Status codes are the API\'s vocabulary',
      p: [
        'Your React error handling was only ever as good as the status codes the backend sent. Now that\'s your responsibility. The working set: **200** OK, **201** created (every successful POST-that-creates), **204** done-but-no-body (deletes), **400** you sent garbage, **401** who are you, **403** you can\'t do that, **404** no such thing, **409** conflict, **500** we crashed.',
        'Express defaults everything to 200, so the discipline is remembering the non-200 cases: `res.status(201).json(newThing)`.',
      ],
    },
    {
      h: 'Headers, both directions',
      p: [
        'Incoming headers are on `req.headers` with **lowercased** names: `req.headers[\'content-type\']`, `req.headers.authorization`. Outgoing headers are set with `res.set(\'X-Header-Name\', \'value\')` before you send the body.',
        'Custom `X-` headers are how services pass metadata — request ids for tracing, rate-limit counters, deprecation warnings. You\'ll see them in every production API\'s responses.',
      ],
      code: `app.get('/limited', (req, res) => {
  res.set('X-RateLimit-Remaining', '42');
  res.set('X-Request-Id', 'abc-123');
  res.json({ ok: true });
});`,
      codeTitle: 'headers.js',
    },
  ],
  exercise: {
    brief: [
      '`POST /echo` → status 201 with `{ "youSent": <the parsed body>, "contentType": <the request\'s content-type header> }`',
      '`GET /teapot` → status 418 with a body containing the word `teapot` (yes, 418 is real — RFC 2324)',
      '`GET /headers` → set response header `X-Powered-By-Me: express-academy`, respond `{ "ok": true }`',
    ],
    hints: [
      'Don\'t forget `app.use(express.json())` before the routes',
      'Chain it: `res.status(201).json({...})`',
      'The incoming header is `req.headers[\'content-type\']` — lowercase',
    ],
  },
} satisfies Lesson;

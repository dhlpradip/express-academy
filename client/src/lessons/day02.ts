import type { Lesson } from './types.ts';

export default {
  day: 2,
  id: 'day02',
  arc: 'Foundations',
  minutes: 45,
  title: 'Routing: params and query strings',
  summary: 'Dynamic URL segments, query strings, and why req.params are always strings',
  intro:
    "You already know these URLs from React Router — `/users/:id` is the same syntax on both sides of the wire. Today you learn how the server reads the dynamic parts of a URL and turns them into data your handler can use.",
  sections: [
    {
      h: 'Route params: the :placeholders',
      p: [
        'A colon in a route path declares a **route parameter** — a wildcard segment whose actual value lands in `req.params`. This is the backbone of every REST API: the resource type lives in the path, the specific resource in the param.',
      ],
      code: `app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// Multiple params compose naturally:
app.get('/users/:id/posts/:postId', (req, res) => {
  const { id, postId } = req.params;
  res.json({ id, postId });
});`,
      codeTitle: 'params.js',
      note: 'Params are ALWAYS strings. `GET /users/7` gives you `req.params.id === "7"`, not `7`. If your data uses numeric ids, convert with `Number(req.params.id)` before comparing — `7 === "7"` is false and this exact bug will eat an afternoon of your life at some point. Today it eats five minutes instead.',
    },
    {
      h: 'Query strings: optional, unordered extras',
      p: [
        'Everything after the `?` is parsed into `req.query` for free: `/search?q=express&page=2` gives you `{ q: \'express\', page: \'2\' }`. (Strings again!)',
        'The convention: **params** identify *which resource* (`/todos/42`), **query strings** modify *how you want it* — filters, sorting, pagination. A missing param means a different route entirely; a missing query key is just `undefined`, so you must handle it.',
      ],
      code: `app.get('/search', (req, res) => {
  const { q, page = '1' } = req.query; // default values work like anywhere in JS

  if (!q) {
    return res.status(400).json({ error: 'q is required' });
  }
  res.json({ query: q, page: Number(page), results: [] });
});`,
      codeTitle: 'query.js',
    },
    {
      h: 'The early-return pattern',
      p: [
        "Notice the `return res.status(400)...` above. `res.json()` sends the response but does NOT stop your function — code after it keeps running, and if that code sends *another* response you get the infamous `Cannot set headers after they are sent` crash.",
        'The idiom every Express codebase uses: `return` whenever you respond inside a conditional. Treat "one request, exactly one response" as a law.',
      ],
    },
    {
      h: 'Route order matters',
      p: [
        'Express matches routes top to bottom and stops at the first hit. If you declare `app.get(\'/users/:id\')` *before* `app.get(\'/users/me\')`, a request to `/users/me` matches the param route with `id === "me"`. Put specific routes above dynamic ones — the same specificity thinking as CSS, but resolved by order instead of weight.',
      ],
    },
  ],
  exercise: {
    brief: [
      '`GET /greet/:name` → JSON `{ "message": "Hello, <name>!" }`',
      '`GET /search` → with `?q=term`: JSON `{ "query": "<term>", "results": [] }`; without `q`: status 400 and `{ "error": "q is required" }`',
      '`GET /users/:id/posts/:postId` → JSON `{ "userId": "<id>", "postId": "<postId>" }` — remember, params stay strings here',
    ],
    hints: [
      'Template literals are your friend: `` `Hello, ${req.params.name}!` ``',
      'Check for the missing query param with `if (!q)` and remember the `return`',
      'The test expects `userId: "7"` as a string — no conversion needed on this one',
    ],
  },
} satisfies Lesson;

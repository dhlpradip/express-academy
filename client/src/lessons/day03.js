export default {
  day: 3,
  id: 'day03',
  arc: 'Foundations',
  minutes: 55,
  title: 'Middleware: the assembly line',
  summary: "Express's core idea — functions that run in order before your handler",
  intro:
    'If you learn one Express concept deeply, make it this one. Middleware is how everything real gets done — logging, auth, body parsing, CORS, error handling are all middleware. The framework is honestly just a middleware runner with routing bolted on.',
  sections: [
    {
      h: 'The pipeline',
      p: [
        'Every request flows through a chain of functions in the order you registered them. Each function can inspect the request, modify it, respond and end the chain, or call `next()` to pass control down the line. Your route handler is simply the last stop.',
        "React analogy: it's a chain of higher-order components, or Redux middleware — each layer wraps the next and decides whether to continue.",
      ],
      code: `function logger(req, res, next) {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // without this line, the request hangs forever
}

app.use(logger);           // runs for EVERY request
app.use(express.json());   // built-in middleware: parses JSON bodies

app.get('/todos', handler); // handlers only run after all app.use() above them`,
      codeTitle: 'pipeline.js',
    },
    {
      h: 'The three superpowers',
      p: [
        '**1. Enrich the request.** Middleware can attach data for later handlers: `req.user = decodedToken` is how every auth system works. It\'s the server-side version of putting data in React context so children can read it.',
        '**2. Short-circuit.** Middleware can respond and *not* call `next()` — the rest of the chain never runs. That\'s a guard clause for routes: an auth check that responds 401 stops unauthorized requests from ever reaching handlers.',
        '**3. Scope.** Applied with `app.use(fn)` it runs everywhere; passed as `app.get(\'/admin\', fn, handler)` it guards one route; mounted as `app.use(\'/api\', fn)` it covers a prefix.',
      ],
      code: `function requireAdmin(req, res, next) {
  if (req.headers['x-role'] !== 'admin') {
    return res.status(403).json({ error: 'forbidden' }); // short-circuit
  }
  next(); // all good, continue to the handler
}

app.get('/admin/stats', requireAdmin, (req, res) => {
  res.json({ secretStats: true });
});`,
      codeTitle: 'guard.js',
    },
    {
      h: 'Order is everything',
      p: [
        'Middleware registered *after* a route never runs for it. The classic bug: mounting `express.json()` after your POST routes and wondering why `req.body` is undefined. Standard layout — general middleware first (logging, parsing, CORS), then routes with their specific guards, then 404 and error handlers dead last (day 6).',
      ],
      note: 'Middleware keeping state between requests (a counter, a cache) just uses closure variables declared outside the function — the process lives across requests, so the variable does too. That is also the trap: this state is per-process and vanishes on restart. Fine for learning; real shared state belongs in a database or Redis.',
    },
  ],
  exercise: {
    brief: [
      'A `requestId` middleware for ALL routes: set response header `X-Request-Id` to `req-1`, `req-2`, … incrementing per request (closure counter + `res.set()`)',
      '`GET /public` → `{ "message": "public ok" }`',
      'A `requireApiKey` middleware for `/secret` only: header `x-api-key` must equal `letmein`, otherwise 401 `{ "error": "unauthorized" }`',
      '`GET /secret` → `{ "message": "secret ok" }` when the key is right',
      'Order matters: the request-id header must be present even on rejected requests',
    ],
    hints: [
      'Declare `let counter = 0;` OUTSIDE the middleware function; increment inside',
      'Incoming header names are lowercase in Node: `req.headers[\'x-api-key\']`',
      'Attach the guard to one route: `app.get(\'/secret\', requireApiKey, handler)`',
      'Register `app.use(requestId)` BEFORE the routes so it runs first',
    ],
  },
};

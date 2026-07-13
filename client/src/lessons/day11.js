export default {
  day: 11,
  id: 'day11',
  arc: 'Production',
  minutes: 60,
  title: 'CORS and rate limiting, by hand',
  summary: 'Finally understand CORS from the server side — plus your first rate limiter',
  intro:
    "Five years of React means five years of CORS errors. Today, closure: you build the server side of CORS with your own hands, and the red console error will never be mysterious again. Then a second production essential — rate limiting — using the same middleware muscle.",
  sections: [
    {
      h: 'What CORS actually is',
      p: [
        "The browser's same-origin policy blocks JS on `app.com` from reading responses from `api.com` — by default, cross-origin reads are forbidden. CORS is the server's mechanism to *opt in*: response headers that tell the browser \"this origin may read this response.\"",
        'Three things that finally make it click: **the server was never blocking you** — the browser blocks, the server just failed to grant permission. **The request usually still executes** — only the *reading* is blocked (curl and Postman ignore CORS entirely; it\'s a browser concept). **The fix always belongs on the server** — which is why frontend-you could never truly fix it, only backend-you can.',
      ],
    },
    {
      h: 'The mechanics',
      p: [
        'For simple requests: the browser sends an `Origin` header; if the response carries `Access-Control-Allow-Origin` matching it, the browser releases the response to your JS. That\'s it — one header.',
        '"Non-simple" requests (any JSON POST, anything with an Authorization header — i.e., everything interesting) get a **preflight**: the browser first sends `OPTIONS` asking permission, and the server must answer with allowed methods and headers before the real request happens. That phantom OPTIONS request in your network tab all these years? That\'s the one.',
      ],
      code: `function corsMiddleware(req, res, next) {
  if (req.headers.origin === ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') { // the preflight
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end(); // answer it, never call next()
  }
  next();
}`,
      codeTitle: 'cors-by-hand.js',
      note: 'In real projects you `npm install cors` and configure it in one line — today\'s hand-rolled version exists so the library is never magic. Related security one-liners for production: `helmet` (safe default headers) and `express-rate-limit`.',
    },
    {
      h: 'Rate limiting',
      p: [
        'Any public endpoint will be hammered — by attackers brute-forcing logins, by scrapers, or by your own frontend stuck in a retry loop. A rate limiter counts requests and answers **429 Too Many Requests** past a threshold. Production versions track per-IP with time windows in Redis; the core is just middleware with a counter, which is exactly what you\'ll build.',
        'Note where you attach it: as **route-level middleware** on the expensive endpoint, not globally — you rarely want preflights and health checks eating the budget.',
      ],
    },
  ],
  exercise: {
    brief: [
      'A CORS middleware for all requests: if the `Origin` header equals `http://localhost:5173`, echo it in `Access-Control-Allow-Origin`; a non-matching origin gets NO such header',
      'For `OPTIONS` requests also set `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE` and `Access-Control-Allow-Headers: Content-Type, Authorization`, then end with 204',
      'A `rateLimit` middleware ONLY on `GET /data`: first 3 requests pass, then 429 `{ "error": "too many requests" }`',
      '`GET /data` → `{ "data": "sensitive" }`',
    ],
    hints: [
      'The incoming origin is `req.headers.origin` — compare, then echo it back',
      'For OPTIONS: set headers, `return res.status(204).end()` — do NOT call next()',
      'Day 3 closure counter again: `let hits = 0` outside the middleware',
      'Route-level attachment keeps OPTIONS from being counted: `app.get(\'/data\', rateLimit, handler)`',
    ],
  },
};

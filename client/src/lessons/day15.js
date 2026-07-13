export default {
  day: 15,
  id: 'day15',
  arc: 'Beyond the Request',
  minutes: 60,
  title: 'Caching with Redis patterns',
  summary: 'Cache-aside, TTLs, and invalidation — making slow things fast',
  intro:
    "Week 3 begins: everything from here happens *around* the request cycle, not inside it. First up, the highest-leverage performance tool in backend work: caching. You've used `useMemo` and React Query's cache — same instinct, but now the thing being cached is a database query, and the stakes are every user at once.",
  sections: [
    {
      h: 'What Redis actually is',
      p: [
        "Redis is a separate server process that holds data **in memory** — reads take microseconds where a database query takes tens of milliseconds. Every value is looked up by a string key; values are strings (you `JSON.stringify` objects in and `JSON.parse` them out). It's shared across all your app instances, which is what makes it better than a per-process object: ten Node servers, one cache.",
        'The API is tiny and you\'ll use five commands for 95% of work: `get`, `set`, `del`, `expire`, `incr`. Today\'s exercise ships a fake client with exactly that shape — the patterns you write transfer verbatim to `ioredis` with a real server.',
      ],
    },
    {
      h: 'Cache-aside: the pattern that runs the internet',
      p: [
        'The read path: **check the cache first** — hit? return it, done, microseconds. Miss? Do the expensive fetch, **store the result in the cache**, return it. The first reader pays full price; everyone after rides free until the entry expires.',
        'Key naming is a convention worth adopting from day one: `entity:id` (like `product:42`, `user:7:profile`). Colons namespace your keys so a thousand cache entries stay navigable.',
      ],
      code: `// The cache-aside read, canonical form:
app.get('/products/:id', asyncHandler(async (req, res) => {
  const key = \`product:\${req.params.id}\`;

  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));      // ~2ms

  const product = await db.products.findById(req.params.id); // ~100ms
  if (!product) return res.status(404).json({ error: 'not found' });

  await redis.set(key, JSON.stringify(product), { EX: 60 }); // TTL: 60s
  res.json(product);
}));`,
      codeTitle: 'cache-aside.js',
    },
    {
      h: 'TTLs and invalidation — the hard part',
      p: [
        '"There are only two hard things in computer science: cache invalidation and naming things." The joke is old because it\'s true. A cache entry that outlives the truth it describes serves **stale data** — users seeing yesterday\'s price is worse than users waiting 100ms.',
        'Two defenses, used together: **TTL** (`EX: 60` = expire in 60 seconds) caps how stale anything can get, a safety net for invalidations you forgot. **Explicit invalidation** — every write path that changes the data must `del` the affected keys. Update a product → delete `product:<id>`. The next read misses, fetches fresh, re-caches. That write-then-delete discipline is exactly what today\'s tests enforce.',
      ],
      note: "What NOT to cache: anything user-specific under a shared key (one user seeing another's data is a security incident, not a bug), and — as a default — error/null results, or a typo'd URL can poison the cache. Cache the hot, shared, read-heavy stuff: product pages, settings, computed aggregates.",
    },
    {
      h: 'How you prove a cache works',
      p: [
        "A cache that's silently broken looks identical from the outside — responses still arrive, just slow. So production caches are **observable**: an `X-Cache: HIT|MISS` header and a counter of real database calls. Today's exercise makes you build both, and the tests read them: they check the second request is a HIT, that it comes back in under 100ms, and that `dbCalls` stayed at 1. When you later use Redis for real, keep this habit — a hit-rate dashboard is the first thing to check when an API gets slow.",
      ],
    },
  ],
  exercise: {
    brief: [
      '`GET /products/:id` → cache-aside on key `product:<id>`: hit → `X-Cache: HIT` + the parsed cached JSON; miss → fetch from db (null → 404 `{ "error": "product not found" }`), store with `{ EX: 60 }`, respond with `X-Cache: MISS`',
      '`PATCH /products/:id` → update in db (null → 404), then `redis.del` the key — invalidation — and return the updated product',
      '`GET /stats` → `{ "dbCalls": <count> }` so the tests can prove your cache actually prevents db reads',
    ],
    hints: [
      'Redis stores strings: `JSON.stringify` going in, `JSON.parse` coming out',
      'The provided client matches real Redis: `await redis.set(key, value, { EX: 60 })`',
      'Every route here awaits — wrap them in the day 6 asyncHandler and keep an error middleware at the bottom',
      'The dbCalls math in the tests assumes you do NOT cache 404s — check cache, fetch, then bail on null before setting',
    ],
  },
};

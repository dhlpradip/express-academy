/** @type {import('./index.js').Exercise} */
export default {
  id: 'day15',
  title: 'Caching with Redis patterns',
  starter: `const express = require('express');
const app = express();

app.use(express.json());

// ---- provided: a fake Redis client + a slow database (do not edit) ------
// The client mimics ioredis/node-redis: async get/set/del, string values, TTLs.
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function createRedis() {
  const store = new Map(); // key -> { value, expiresAt }
  return {
    async get(key) {
      await delay(2);
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, opts = {}) {
      await delay(2);
      store.set(key, {
        value: String(value),
        expiresAt: opts.EX ? Date.now() + opts.EX * 1000 : null,
      });
    },
    async del(key) {
      await delay(2);
      store.delete(key);
    },
  };
}
const redis = createRedis();

const productsTable = {
  1: { id: '1', name: 'Mechanical Keyboard', price: 120 },
  2: { id: '2', name: 'Vertical Mouse', price: 80 },
};
let dbCalls = 0;
async function fetchProductFromDb(id) {
  await delay(120); // the latency we're caching away
  dbCalls += 1;
  return productsTable[id] ? { ...productsTable[id] } : null;
}
async function updateProductInDb(id, fields) {
  await delay(20);
  if (!productsTable[id]) return null;
  Object.assign(productsTable[id], fields);
  return { ...productsTable[id] };
}
// --------------------------------------------------------------------------

// TODO 1: GET /products/:id — the CACHE-ASIDE pattern:
//   1. try the cache first: const cached = await redis.get(\`product:\${id}\`)
//      - hit  -> res.set('X-Cache', 'HIT') and respond with JSON.parse(cached)
//   2. miss -> await fetchProductFromDb(id)
//      - null -> 404 { "error": "product not found" }  (do NOT cache misses here)
//      - else -> await redis.set(key, JSON.stringify(product), { EX: 60 })
//                res.set('X-Cache', 'MISS') and respond with the product

// TODO 2: PATCH /products/:id — update AND INVALIDATE:
//   - await updateProductInDb(id, req.body); null -> 404
//   - await redis.del(\`product:\${id}\`)   <- stale cache is worse than no cache
//   - respond with the updated product

// TODO 3: GET /stats -> { "dbCalls": dbCalls }  (the tests use this to PROVE your cache works)

// Bring back the day 6 asyncHandler + error middleware — every route here awaits.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function createRedis() {
  const store = new Map();
  return {
    async get(key) {
      await delay(2);
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, opts = {}) {
      await delay(2);
      store.set(key, {
        value: String(value),
        expiresAt: opts.EX ? Date.now() + opts.EX * 1000 : null,
      });
    },
    async del(key) {
      await delay(2);
      store.delete(key);
    },
  };
}
const redis = createRedis();

const productsTable = {
  1: { id: '1', name: 'Mechanical Keyboard', price: 120 },
  2: { id: '2', name: 'Vertical Mouse', price: 80 },
};
let dbCalls = 0;
async function fetchProductFromDb(id) {
  await delay(120);
  dbCalls += 1;
  return productsTable[id] ? { ...productsTable[id] } : null;
}
async function updateProductInDb(id, fields) {
  await delay(20);
  if (!productsTable[id]) return null;
  Object.assign(productsTable[id], fields);
  return { ...productsTable[id] };
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const key = \`product:\${req.params.id}\`;
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
    const product = await fetchProductFromDb(req.params.id);
    if (!product) return res.status(404).json({ error: 'product not found' });
    await redis.set(key, JSON.stringify(product), { EX: 60 });
    res.set('X-Cache', 'MISS');
    res.json(product);
  })
);

app.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const updated = await updateProductInDb(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'product not found' });
    await redis.del(\`product:\${req.params.id}\`);
    res.json(updated);
  })
);

app.get('/stats', (req, res) => {
  res.json({ dbCalls });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();
app.use(express.json());

// ---- provided: a fake Redis client + a slow database (do not edit) ------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

function createRedis() {
  const store = new Map<string, CacheEntry>();
  return {
    async get(key: string): Promise<string | null> {
      await delay(2);
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: string, opts: { EX?: number } = {}): Promise<void> {
      await delay(2);
      store.set(key, { value, expiresAt: opts.EX ? Date.now() + opts.EX * 1000 : null });
    },
    async del(key: string): Promise<void> {
      await delay(2);
      store.delete(key);
    },
  };
}
const redis = createRedis();

interface Product {
  id: string;
  name: string;
  price: number;
}

const productsTable: Record<string, Product> = {
  '1': { id: '1', name: 'Mechanical Keyboard', price: 120 },
  '2': { id: '2', name: 'Vertical Mouse', price: 80 },
};
let dbCalls = 0;
async function fetchProductFromDb(id: string): Promise<Product | null> {
  await delay(120);
  dbCalls += 1;
  return productsTable[id] ? { ...productsTable[id] } : null;
}
async function updateProductInDb(id: string, fields: Partial<Product>): Promise<Product | null> {
  await delay(20);
  if (!productsTable[id]) return null;
  Object.assign(productsTable[id], fields);
  return { ...productsTable[id] };
}
// --------------------------------------------------------------------------

// TODO 1: GET /products/:id — CACHE-ASIDE:
//   cache hit  -> X-Cache: HIT, respond JSON.parse(cached) (type it: as Product)
//   cache miss -> fetch; null -> 404 { "error": "product not found" };
//                 else redis.set(key, JSON.stringify(product), { EX: 60 }),
//                 X-Cache: MISS, respond with the product

// TODO 2: PATCH /products/:id — update, then redis.del(key) to INVALIDATE; null -> 404

// TODO 3: GET /stats -> { "dbCalls": dbCalls }

// Bring back the typed asyncHandler + error middleware from day 6.

export default app;
`,
  solutionTs: `import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';

const app = express();
app.use(express.json());

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

function createRedis() {
  const store = new Map<string, CacheEntry>();
  return {
    async get(key: string): Promise<string | null> {
      await delay(2);
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key: string, value: string, opts: { EX?: number } = {}): Promise<void> {
      await delay(2);
      store.set(key, { value, expiresAt: opts.EX ? Date.now() + opts.EX * 1000 : null });
    },
    async del(key: string): Promise<void> {
      await delay(2);
      store.delete(key);
    },
  };
}
const redis = createRedis();

interface Product {
  id: string;
  name: string;
  price: number;
}

const productsTable: Record<string, Product> = {
  '1': { id: '1', name: 'Mechanical Keyboard', price: 120 },
  '2': { id: '2', name: 'Vertical Mouse', price: 80 },
};
let dbCalls = 0;
async function fetchProductFromDb(id: string): Promise<Product | null> {
  await delay(120);
  dbCalls += 1;
  return productsTable[id] ? { ...productsTable[id] } : null;
}
async function updateProductInDb(id: string, fields: Partial<Product>): Promise<Product | null> {
  await delay(20);
  if (!productsTable[id]) return null;
  Object.assign(productsTable[id], fields);
  return { ...productsTable[id] };
}

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const key = \`product:\${req.params.id}\`;
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached) as Product);
    }
    const product = await fetchProductFromDb(req.params.id);
    if (!product) return res.status(404).json({ error: 'product not found' });
    await redis.set(key, JSON.stringify(product), { EX: 60 });
    res.set('X-Cache', 'MISS');
    res.json(product);
  })
);

app.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const updated = await updateProductInDb(req.params.id, req.body as Partial<Product>);
    if (!updated) return res.status(404).json({ error: 'product not found' });
    await redis.del(\`product:\${req.params.id}\`);
    res.json(updated);
  })
);

app.get('/stats', (req: Request, res: Response) => {
  res.json({ dbCalls });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

export default app;
`,
  tests: [
    {
      name: 'First read is a MISS and hits the database',
      request: { method: 'GET', path: '/products/1' },
      expect: { status: 200, json: { id: '1', name: 'Mechanical Keyboard' }, headers: { 'x-cache': 'MISS' } },
    },
    {
      name: 'Second read is a HIT — and fast (under 100ms vs the 120ms db)',
      request: { method: 'GET', path: '/products/1' },
      expect: { status: 200, json: { name: 'Mechanical Keyboard' }, headers: { 'x-cache': 'HIT' }, maxMs: 100 },
    },
    {
      name: 'The cache really did prevent a second db call',
      request: { method: 'GET', path: '/stats' },
      expect: { status: 200, json: { dbCalls: 1 } },
    },
    {
      name: 'Each product gets its own cache key',
      request: { method: 'GET', path: '/products/2' },
      expect: { status: 200, json: { name: 'Vertical Mouse' }, headers: { 'x-cache': 'MISS' } },
    },
    {
      name: 'An unknown product is a 404 (and not cached)',
      request: { method: 'GET', path: '/products/999' },
      expect: { status: 404, json: { error: 'product not found' } },
    },
    {
      name: 'PATCH updates the product',
      request: { method: 'PATCH', path: '/products/1', json: { price: 200 } },
      expect: { status: 200, json: { price: 200 } },
    },
    {
      name: 'PATCH on an unknown product is a 404',
      request: { method: 'PATCH', path: '/products/999', json: { price: 1 } },
      expect: { status: 404 },
    },
    {
      name: 'The update INVALIDATED the cache — next read is a fresh MISS with the new price',
      request: { method: 'GET', path: '/products/1' },
      expect: { status: 200, json: { price: 200 }, headers: { 'x-cache': 'MISS' } },
    },
    {
      name: 'Total damage: the whole session cost only 4 db reads',
      request: { method: 'GET', path: '/stats' },
      expect: { status: 200, json: { dbCalls: 4 } },
    },
  ],
};

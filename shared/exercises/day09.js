export default {
  id: 'day09',
  title: 'Async data layer (a database in disguise)',
  starter: `const express = require('express');
const app = express();

app.use(express.json());

// ---- fake database driver (provided — do not edit) ---------------------
// Every method is async with real latency, and findById REJECTS for the id
// "boom" — exactly like a real driver when the connection drops.
function createDb() {
  let rows = [{ id: '1', title: 'The Pragmatic Programmer' }];
  let nextId = 2;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    async findAll() { await delay(20); return [...rows]; },
    async findById(id) {
      await delay(20);
      if (id === 'boom') throw new Error('db connection lost');
      return rows.find((r) => r.id === id) || null;
    },
    async insert(data) {
      await delay(20);
      const row = { id: String(nextId++), ...data };
      rows.push(row);
      return row;
    },
  };
}
const db = createDb();
// ------------------------------------------------------------------------

// TODO 1: GET /books        -> await db.findAll(), respond with the array
// TODO 2: POST /books       -> if body.title is missing respond 400
//                              { "error": "title is required" },
//                              else await db.insert({ title }) and respond 201 with the row
// TODO 3: GET /books/:id    -> await db.findById(id);
//                              null -> 404 { "error": "book not found" }
// TODO 4: if the db REJECTS (try GET /books/boom), the error must reach your
//         error middleware and become 500 { "error": "db connection lost" }.
//         Write an asyncHandler wrapper or try/catch + next(err) in every route.
// TODO 5: the error middleware itself: (err, req, res, next) -> 500 { "error": err.message }

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

function createDb() {
  let rows = [{ id: '1', title: 'The Pragmatic Programmer' }];
  let nextId = 2;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    async findAll() { await delay(20); return [...rows]; },
    async findById(id) {
      await delay(20);
      if (id === 'boom') throw new Error('db connection lost');
      return rows.find((r) => r.id === id) || null;
    },
    async insert(data) {
      await delay(20);
      const row = { id: String(nextId++), ...data };
      rows.push(row);
      return row;
    },
  };
}
const db = createDb();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  '/books',
  asyncHandler(async (req, res) => {
    res.json(await db.findAll());
  })
);

app.post(
  '/books',
  asyncHandler(async (req, res) => {
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    const row = await db.insert({ title });
    res.status(201).json(row);
  })
);

app.get(
  '/books/:id',
  asyncHandler(async (req, res) => {
    const book = await db.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'book not found' });
    res.json(book);
  })
);

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();
app.use(express.json());

// ---- fake database driver (provided — do not edit) ---------------------
interface Book {
  id: string;
  title: string;
}

function createDb() {
  let rows: Book[] = [{ id: '1', title: 'The Pragmatic Programmer' }];
  let nextId = 2;
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return {
    async findAll(): Promise<Book[]> { await delay(20); return [...rows]; },
    async findById(id: string): Promise<Book | null> {
      await delay(20);
      if (id === 'boom') throw new Error('db connection lost');
      return rows.find((r) => r.id === id) ?? null;
    },
    async insert(data: { title: string }): Promise<Book> {
      await delay(20);
      const row: Book = { id: String(nextId++), ...data };
      rows.push(row);
      return row;
    },
  };
}
const db = createDb();
// ------------------------------------------------------------------------

// TODO 1: GET /books        -> await db.findAll(), respond with the array
// TODO 2: POST /books       -> missing body.title -> 400 { "error": "title is required" },
//                              else await db.insert({ title }) -> 201 with the row
// TODO 3: GET /books/:id    -> await db.findById(id); null -> 404 { "error": "book not found" }
// TODO 4: a rejecting db call (GET /books/boom) must reach your error middleware
//         -> 500 { "error": "db connection lost" }. asyncHandler time again.
// TODO 5: error middleware: (err, req, res, next) -> 500 { "error": err.message }

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

interface Book {
  id: string;
  title: string;
}

function createDb() {
  let rows: Book[] = [{ id: '1', title: 'The Pragmatic Programmer' }];
  let nextId = 2;
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return {
    async findAll(): Promise<Book[]> { await delay(20); return [...rows]; },
    async findById(id: string): Promise<Book | null> {
      await delay(20);
      if (id === 'boom') throw new Error('db connection lost');
      return rows.find((r) => r.id === id) ?? null;
    },
    async insert(data: { title: string }): Promise<Book> {
      await delay(20);
      const row: Book = { id: String(nextId++), ...data };
      rows.push(row);
      return row;
    },
  };
}
const db = createDb();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

app.get(
  '/books',
  asyncHandler(async (req, res) => {
    res.json(await db.findAll());
  })
);

app.post(
  '/books',
  asyncHandler(async (req, res) => {
    const { title } = (req.body ?? {}) as { title?: unknown };
    if (typeof title !== 'string' || title === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    const row = await db.insert({ title });
    res.status(201).json(row);
  })
);

app.get(
  '/books/:id',
  asyncHandler(async (req, res) => {
    const book = await db.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'book not found' });
    res.json(book);
  })
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

export default app;
`,
  tests: [
    {
      name: 'GET /books returns the seeded book',
      request: { method: 'GET', path: '/books' },
      expect: { status: 200, jsonLength: 1, json: [{ id: '1', title: 'The Pragmatic Programmer' }] },
    },
    {
      name: 'POST /books inserts and responds 201 with the new row',
      request: { method: 'POST', path: '/books', json: { title: 'Designing Data-Intensive Applications' } },
      expect: { status: 201, json: { title: 'Designing Data-Intensive Applications' }, jsonHas: ['id'] },
      save: { bookId: 'json.id' },
    },
    {
      name: 'The new book can be fetched by its id',
      request: { method: 'GET', path: '/books/{{bookId}}' },
      expect: { status: 200, json: { title: 'Designing Data-Intensive Applications' } },
    },
    {
      name: 'POST /books without a title is a 400',
      request: { method: 'POST', path: '/books', json: {} },
      expect: { status: 400, json: { error: 'title is required' } },
    },
    {
      name: 'A missing id is a 404, not a crash',
      request: { method: 'GET', path: '/books/999' },
      expect: { status: 404, json: { error: 'book not found' } },
    },
    {
      name: 'A rejecting db call becomes a clean 500 (GET /books/boom)',
      request: { method: 'GET', path: '/books/boom' },
      expect: { status: 500, json: { error: 'db connection lost' } },
    },
    {
      name: 'And the server is still alive afterwards',
      request: { method: 'GET', path: '/books' },
      expect: { status: 200 },
    },
  ],
};

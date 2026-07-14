import type { Lesson } from './types.ts';

export default {
  day: 9,
  id: 'day09',
  arc: 'Building APIs',
  minutes: 60,
  title: 'Async data layer (a database in disguise)',
  summary: 'Awaiting a data layer, handling rejections, and where real databases fit',
  intro:
    "Everything so far stored data in arrays — synchronous and immortal-until-restart. Real data lives across a network hop: every read and write is async, adds latency, and can fail. Today's exercise gives you a fake database driver with all three properties, so the handler patterns you learn transfer directly to Prisma or pg next week.",
  sections: [
    {
      h: 'The landscape, briefly',
      p: [
        '**PostgreSQL** is the default relational choice and the one to learn properly — tables, joins, transactions, indexes. **MongoDB** stores JSON-ish documents. In Node you rarely write raw SQL by hand; you go through an ORM: **Prisma** (schema-first, superb TypeScript types — the natural pick coming from React), **Drizzle** (closer to SQL), or **Sequelize/TypeORM** in older codebases.',
        "Whatever the tool, the shape in your handler is identical: `await db.something(...)` inside try/catch-or-asyncHandler. That shape is today's whole lesson.",
      ],
      code: `// What tomorrow's real code looks like — Prisma flavor:
app.get('/books/:id', asyncHandler(async (req, res) => {
  const book = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!book) return res.status(404).json({ error: 'book not found' });
  res.json(book);
}));`,
      codeTitle: 'the-shape-of-things-to-come.js',
    },
    {
      h: 'The three async-data rules',
      p: [
        "**1. Await everything, always.** Forgetting `await` doesn't error — it hands you a pending Promise, which serializes as `{}` and produces baffling bugs three components downstream. If a function talks to the db, it's async, full stop.",
        '**2. `null` is an answer, rejection is a failure.** A query that finds nothing *resolves* with null → that\'s your 404. A broken connection *rejects* → that\'s a 500 via your error middleware. Two different failure modes, two different status codes — conflating them is a classic API smell.',
        '**3. Every await can throw.** The day 6 asyncHandler is no longer optional ceremony; a database that hiccups must become a clean 500, not a dead process.',
      ],
    },
    {
      h: 'Today\'s stand-in driver',
      p: [
        "The exercise starter ships a `createDb()` with `findAll`, `findById`, and `insert` — each artificially delayed, and `findById('boom')` rejects with `Error('db connection lost')`, simulating the outage you can't simulate with a real local database. Your handlers must survive it. When you later swap in Prisma, only the db calls change; the handler skeleton — await, null-check, asyncHandler — stays.",
      ],
      note: "After this course, do it for real: `npx prisma init`, point it at SQLite (zero setup), and rebuild this books API against a genuine database. It's a 30-minute exercise once today's shapes are muscle memory.",
    },
  ],
  exercise: {
    brief: [
      '`GET /books` → await `db.findAll()`, respond with the array',
      '`POST /books` → missing `body.title` → 400 `{ "error": "title is required" }`; else await `db.insert({ title })` → 201 with the new row',
      '`GET /books/:id` → await `db.findById(id)`; `null` → 404 `{ "error": "book not found" }`',
      'When the db rejects (`GET /books/boom`), the error must flow to your error middleware → 500 `{ "error": "db connection lost" }`',
      'Error middleware: `(err, req, res, next)` → 500 `{ "error": err.message }`',
    ],
    hints: [
      'Bring back the day 6 asyncHandler and wrap all three routes',
      'null-check AFTER the await: `const book = await db.findById(...); if (!book) return res.status(404)...`',
      'You don\'t write any special code for /books/boom — if asyncHandler + error middleware are right, it just works. That\'s the point.',
    ],
  },
  resources: [
    {
      title: "Prisma — Quickstart",
      url: "https://www.prisma.io/docs/getting-started/quickstart-sqlite",
      note: "your next step after this course: this books API against real SQLite in ~30 min",
    },
    {
      title: "SQLBolt",
      url: "https://sqlbolt.com",
      note: "interactive SQL from zero — do this in parallel with the course",
    },
    {
      title: "pgexercises",
      url: "https://pgexercises.com",
      note: "PostgreSQL practice against a real schema once SQLBolt feels easy",
    },
    {
      title: "Drizzle ORM",
      url: "https://orm.drizzle.team",
      note: "the SQL-flavored alternative to Prisma; know both names for interviews",
    },
  ],
} satisfies Lesson;

import type { Lesson } from './types.ts';

export default {
  day: 5,
  id: 'day05',
  arc: 'Building APIs',
  minutes: 60,
  title: 'A full REST resource: /todos',
  summary: 'The classic five endpoints — the interview question and the daily job',
  intro:
    'Today you build the thing backend interviews actually ask for: a complete CRUD resource. Five endpoints, one in-memory array, every REST convention in its right place. This exact shape — list, create, read, update, delete — is 80% of API work.',
  sections: [
    {
      h: 'REST in one paragraph',
      p: [
        'REST maps the things in your domain to **resources** (nouns in URLs) and operations to **HTTP methods** (verbs). You never write `/getTodos` or `/todos/delete/42` — the method already says it: `GET /todos` lists, `POST /todos` creates, `GET /todos/42` reads one, `PATCH /todos/42` updates, `DELETE /todos/42` removes. Your React apps have been consuming this grammar for years; now you\'re writing it.',
      ],
    },
    {
      h: 'The conventions that matter',
      p: [
        '**POST returns 201** with the created object (including its server-assigned `id`) so the client can use it immediately — your React code has relied on this to update local state without refetching.',
        '**DELETE returns 204 No Content** with an empty body — `res.status(204).end()`.',
        '**PATCH merges, PUT replaces.** PATCH `{ done: true }` changes one field and keeps the rest; PUT semantically replaces the whole resource. Most real APIs use PATCH for updates.',
        '**Missing resource = 404 on every route that takes an :id**, including update and delete. Never crash, never silently succeed.',
      ],
      code: `// The shape of every CRUD module you'll ever write:
let todos = [];
let nextId = 1;

app.post('/todos', (req, res) => {
  const todo = { id: nextId++, title: req.body.title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.get('/todos/:id', (req, res) => {
  const todo = todos.find((t) => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'not found' });
  res.json(todo);
});`,
      codeTitle: 'crud-shape.js',
    },
    {
      h: 'Patterns inside the handlers',
      p: [
        'Three micro-patterns to internalize: a `findTodo(id)` helper so the string-vs-number conversion lives in exactly one place; `Object.assign(todo, req.body)` for the PATCH merge (spread\'s mutating cousin — fine here because we *want* to mutate the stored object); and early-return 404 guards at the top of every :id route.',
      ],
      note: "The in-memory array resets when the process restarts — and each test run here IS a fresh process, which is why the first test can expect an empty list. Day 9 replaces the array with an async data layer; the handler shapes you write today survive that change almost untouched.",
    },
  ],
  exercise: {
    brief: [
      '`GET /todos` → the full array (starts empty)',
      '`POST /todos` → 201 with `{ id, title, done: false }` — `title` from the body, `id` auto-incrementing',
      '`GET /todos/:id` → the todo, or 404 `{ "error": "not found" }`',
      '`PATCH /todos/:id` → merge body fields into the todo and return it, or 404',
      '`DELETE /todos/:id` → 204 with no body, or 404',
    ],
    hints: [
      '`req.params.id` is a string, your ids are numbers: `todos.find(t => t.id === Number(req.params.id))`',
      'Write the find-by-id helper once, use it in three routes',
      '204 means NO body: `res.status(204).end()` — not `.json(...)`',
      'For PATCH: `Object.assign(todo, req.body)` then `res.json(todo)`',
    ],
  },
  resources: [
    {
      title: "Microsoft — Web API design best practices",
      url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design",
      note: "pragmatic REST guidance from a team that maintains thousands of endpoints",
    },
    {
      title: "Zalando — RESTful API guidelines",
      url: "https://opensource.zalando.com/restful-api-guidelines/",
      note: "a real company’s complete API rulebook — what “conventions at scale” means",
    },
    {
      title: "restfulapi.net",
      url: "https://restfulapi.net/",
      note: "REST concepts from first principles, including what the purists mean",
    },
  ],
} satisfies Lesson;

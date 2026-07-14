import type { Lesson } from './types.ts';

export default {
  day: 14,
  id: 'day14',
  arc: 'Production',
  minutes: 120,
  title: 'Capstone: a complete Notes API',
  summary: 'Everything at once — auth, validation, CRUD, ownership, 16 tests',
  intro:
    'No new concepts today — that\'s the point. You get a spec, an empty file, and 16 tests: exactly what a take-home interview assignment looks like. Build a multi-user notes API where users register, log in, and can only ever touch their own notes.',
  sections: [
    {
      h: 'The one new idea: ownership',
      p: [
        'Authentication answers *who are you*; **authorization** answers *what may you do*. The capstone\'s core requirement: every note belongs to the user who created it (taken from the verified token, never from the request body — the client doesn\'t get to claim an owner!), lists are filtered to the caller, and touching someone else\'s note is **403 Forbidden**.',
        'Mind the 403 vs 404 distinction the tests enforce: a note that doesn\'t exist is 404; a note that exists but isn\'t yours is 403. (Some real APIs deliberately return 404 for both to avoid leaking that a resource exists — a defensible choice, but here the spec says 403, and matching a spec exactly is also a job skill.)',
      ],
    },
    {
      h: 'A build order that works',
      p: [
        'Resist writing everything then running everything. Work like tests-first professionals do: register (validation → duplicate check → hash → 201) and run only those tests, then login, then the `requireAuth` middleware on a trivial protected route, then the notes CRUD, then the 404 catch-all and error middleware. Each run should turn 2–3 more tests green — the run button is free, use it constantly.',
      ],
      code: `// A skeleton to arrange your thinking, not to copy:
//
// 1. app.use(express.json())
// 2. POST /auth/register    — validate → 409-check → hash → 201
// 3. POST /auth/login       — verify → sign JWT → { token }
// 4. requireAuth middleware — day 10, verbatim
// 5. notesRouter (day 8) with router.use(requireAuth):
//      POST /    — validate title → create with owner from req.user
//      GET  /    — notes.filter(n => n.owner === req.user.username)
//      GET  /:id — 404 if absent, 403 if not yours, else the note
//      DELETE /:id — same guards, then 204
// 6. app.use('/notes', notesRouter)
// 7. 404 catch-all + error middleware (day 6)`,
      codeTitle: 'battle-plan.js',
    },
    {
      h: 'Where you go from here',
      p: [
        'When the banner says 200 OK, you have written every load-bearing pattern of the request/response cycle. Passing this capstone unlocks **Week 3 — Beyond the Request** (days 15–17): caching, background jobs, and scheduled tasks — the work that happens when no request is looking. After that, the path in order of leverage: **rebuild this capstone with Prisma + SQLite** so the data survives restarts (~an evening); **add supertest tests** of your own; **deploy it** (Railway or Fly.io, with a real `JWT_SECRET` env var); then point your React skills at it and ship a frontend.',
        'And per the original roadmap: with these patterns internalized, NestJS will read as "Express with enforced structure," and when you get to Django you\'ll recognize every concept wearing different syntax. The second language is always cheaper.',
      ],
      note: 'This capstone — JWT auth, ownership rules, validation, clean errors — is a legitimate portfolio piece and interview-ready talking material. Be able to explain WHY each 401/403/404/409 is what it is; that conversation is the actual interview.',
    },
  ],
  exercise: {
    brief: [
      '`POST /auth/register` — username ≥3 chars AND password ≥6 chars, collected errors → 400 `{ "errors": [...] }` (messages must name the field); duplicate → 409; success → 201, hashed password',
      '`POST /auth/login` → 401 `{ "error": "invalid credentials" }` or `{ "token" }` (JWT, secret `dev-secret`, payload `{ username }`)',
      'ALL `/notes` routes require `Bearer <token>` → else 401 `{ "error": "unauthorized" }`',
      '`POST /notes` `{ title, content? }` — no title → 400 `{ "errors": ["title is required"] }`; success → 201 `{ id, title, content, owner }` with owner from the token',
      '`GET /notes` → only the caller\'s notes; `GET /notes/:id` and `DELETE /notes/:id` → 404 `{ "error": "note not found" }` / 403 `{ "error": "forbidden" }` / success (DELETE → 204)',
      'Unknown routes anywhere → 404 `{ "error": "route not found" }`, plus a final error middleware',
    ],
    hints: [
      'Steal from your own passing solutions: day 7 (validation), day 10 (auth), day 5 (CRUD), day 8 (router), day 6 (safety net)',
      'A `loadNote` middleware for the :id routes keeps the 404/403 logic in one place: find → 404 → owner-check → 403 → attach to `req.note` → next()',
      '`router.use(requireAuth)` protects every note route with one line',
      'The owner is `req.user.username` — from the verified token, never from the body',
    ],
  },
  resources: [
    {
      title: "The Twelve-Factor App",
      url: "https://12factor.net",
      note: "config, logs, processes — the vocabulary of production apps, in 30 minutes",
    },
    {
      title: "Node.js Best Practices",
      url: "https://github.com/goldbergyoni/nodebestpractices",
      note: "read it cover to cover now that every section maps to something you built",
    },
    {
      title: "Render — Deploy Node.js",
      url: "https://render.com/docs/deploy-node-express-app",
      note: "ship this capstone publicly; deployment is a skill only deploying teaches",
    },
    {
      title: "Prisma — Getting started",
      url: "https://www.prisma.io/docs/getting-started",
      note: "the capstone rebuild with a real database is your graduation project",
    },
  ],
} satisfies Lesson;

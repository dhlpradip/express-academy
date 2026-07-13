import type { Lesson } from './types.ts';

export default {
  day: 8,
  id: 'day08',
  arc: 'Building APIs',
  minutes: 50,
  title: 'Routers: structure for real projects',
  summary: 'express.Router, mounting, and how production codebases are laid out',
  intro:
    "Every example so far fit in one file. Real backends don't — the codebase you'll join has dozens of resources. Express's unit of composition is the Router: a mini-app you build in isolation and mount at a prefix, the way you compose React apps from components.",
  sections: [
    {
      h: 'Routers are mini-apps',
      p: [
        '`express.Router()` gives you an object with the same API as `app` — `.get`, `.post`, `.use` — but unattached to any URL. You define routes relative to nothing, then `app.use(\'/api/users\', usersRouter)` mounts the whole bundle at a prefix. The router\'s `/` becomes `/api/users`, its `/:id` becomes `/api/users/:id`.',
        'This is exactly `<Route path="users/*">` with nested relative routes in React Router — same composition, same benefit: the module doesn\'t know or care where it\'s mounted.',
      ],
      code: `const usersRouter = express.Router();

usersRouter.get('/', (req, res) => {        // -> GET /api/users
  res.json(users);
});
usersRouter.get('/:id', (req, res) => {     // -> GET /api/users/:id
  // ...
});

app.use('/api/users', usersRouter);`,
      codeTitle: 'users-router.js',
    },
    {
      h: 'Prefix-scoped middleware',
      p: [
        "`app.use('/api', middleware)` runs the middleware for everything under `/api` and nothing else — version headers, auth for the whole API surface, per-prefix logging. Routers can also carry their own middleware with `router.use(fn)`, which travels with them wherever they're mounted. You'll use exactly that in the day 14 capstone to protect all note routes with one line.",
      ],
    },
    {
      h: 'How real projects are laid out',
      p: [
        'The conventional Express structure separates three layers: **routes** (URL ↔ function wiring, one router file per resource), **controllers/handlers** (the req/res logic), and **services** (business logic that knows nothing about HTTP — the testable core). Small projects merge routes+controllers; the service split appears as soon as logic is reused or tested.',
      ],
      code: `src/
  app.js            // express app: middleware + mount routers (no listen!)
  server.js         // require app, app.listen — split so tests can import app
  routes/
    users.routes.js
    todos.routes.js
  controllers/
    users.controller.js
  services/
    users.service.js  // pure logic, no req/res — easiest code to unit test
  middleware/
    auth.js`,
      codeTitle: 'project-layout — the shape you\'ll see at work',
      note: 'Notice `app.js` vs `server.js`: exporting the app without listening is precisely what this course has made you do every day. Now you know why — it\'s the standard structure for testability.',
    },
  ],
  exercise: {
    brief: [
      'An `apiVersion` middleware setting header `X-Api-Version: 1`, applied to everything under `/api` (and nothing outside it)',
      'A `usersRouter` (seeded with alice id 1, bob id 2): `GET /` → the array; `GET /:id` → the user or 404 `{ "error": "not found" }` — mounted at `/api/users`',
      'A `healthRouter`: `GET /` → `{ "status": "ok" }` — mounted at `/api/health`',
    ],
    hints: [
      'Prefix middleware: `app.use(\'/api\', apiVersion)` before mounting the routers',
      'Routes inside a router are relative: `usersRouter.get(\'/\')`, not `\'/api/users\'`',
      'Same string/number id comparison as day 5: `Number(req.params.id)`',
    ],
  },
} satisfies Lesson;

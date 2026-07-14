# Express Academy

A private, local, 18-day interactive course for learning Express.js — built for a React developer
crossing over to the backend. Each day: concepts → a worked example → an exercise you complete in
the browser, **in JavaScript or TypeScript** (toggle in the exercise panel; each language keeps its
own saved code and reference solution). Your code is executed by a local Node process and graded
with **real HTTP requests**.

The platform itself is TypeScript (React client + Express grader). The only deliberate exceptions:
`server/src/child-runner.cjs` (the sandbox that loads learner code with zero toolchain) and the
lesson/exercise data modules (pure data, typed via `shared/exercises/index.d.ts`).

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Two processes start:

- **client** — the React course app (Vite, port 5173)
- **server** — the grader API (Express, port 4600)

## The 18 days

| Arc | Days | Topics |
|---|---|---|
| Foundations | 01–04 | first server, routing/params, middleware, request & response |
| Building APIs | 05–09 | REST CRUD, error handling, validation, routers/structure, async data |
| Production | 10–14 | JWT auth, CORS & rate limiting, files, async patterns, capstone |
| Beyond the Request | 15–18 | caching (Redis patterns), background jobs & queues, cron & graceful shutdown, Docker & env config |

Days 15–17 simulate Redis and the email service in-process (like day 9's fake database) so the
course stays zero-setup — the patterns transfer verbatim to `ioredis`/BullMQ/node-cron.

Progress and your in-editor code are saved in localStorage. Completing all tests for a day marks
its route `200` in the sidebar. **Days unlock strictly in order** — locked days show `403` and
deep links to them redirect back to your current day (passing the exercise in either language
unlocks the next day).

## How grading works (which is itself an Express lesson)

1. The client POSTs your code (+ language) to `POST /api/run` on the grader.
2. TypeScript submissions are first **type-checked with strict tsc** (`server/src/typechecker.ts`,
   a warm LanguageService so repeat checks are fast) — type errors block the behavior tests,
   the same gate order as CI. Clean code is then transpiled with esbuild.
3. `server/src/runner.ts` writes the JS to a temp file and spawns
   `server/src/child-runner.cjs` in an isolated child process (12s timeout).
4. The child `require()`s your file (that's why every exercise ends with `module.exports = app`
   in JS / `export default app` in TS, and never calls `app.listen` — the runner listens on a
   random free port).
5. Each test in `shared/exercises/dayNN.js` is a declarative HTTP request + assertions on
   status, JSON body, and headers. Results stream back as the test log.

`bcryptjs` and `jsonwebtoken` are installed and requirable from exercise code (days 10 & 14).

## Quality gate

```bash
npm run check       # every reference solution (JS + TS) must pass its own tests;
                    # every starter (both languages) must load without crashing;
                    # every TS solution AND starter must be clean under strict tsc
npm run typecheck   # tsc --noEmit over server and client
```

Run both after editing anything in `shared/exercises/` or the platform code.

## Adding a day

1. `shared/exercises/dayNN.js` — starter/starterTs, tests, solution/solutionTs; register it in
   `shared/exercises/index.js` (types live in `index.d.ts`).
2. `client/src/lessons/dayNN.js` — the teaching content; register it in `client/src/lessons/index.ts`.
3. `npm run check`.

import type { Lesson } from './types.ts';

export default {
  day: 18,
  id: 'day18',
  arc: 'Beyond the Request',
  minutes: 65,
  title: 'Docker: ship the whole machine',
  summary: 'Images, containers, compose — and config that comes from the environment',
  intro:
    '"Works on my machine" dies today. Docker packages your app WITH its runtime — Node version, node_modules, everything — into an image that runs identically on your laptop and in production. The exercise trains the app-side discipline (env config, health endpoints, no secret leaks); the lesson gives you the Dockerfile itself — one now ships in this repo.',
  sections: [
    {
      h: 'Image, container, Dockerfile',
      p: [
        'An **image** is a frozen filesystem + start command, built in layers. A **container** is a running instance of one. The **Dockerfile** is the recipe. The layer trick worth knowing on day one: copy `package*.json` and `npm ci` BEFORE copying your source — then code changes don\'t re-run dependency installation on every build.',
      ],
      code: `FROM node:20-slim

WORKDIR /app

# deps first: this layer only rebuilds when the lockfile changes
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK CMD node -e "fetch('http://localhost:3000/healthz').then(r => process.exit(r.ok ? 0 : 1))"
CMD ["node", "src/server.js"]`,
      codeTitle: 'Dockerfile',
    },
    {
      h: 'Compose: your whole stack in one file',
      p: [
        'Real apps are app + Postgres + Redis. **docker-compose** declares all three and their wiring; `docker compose up` starts everything. Config flows into your app as **environment variables** — the twelve-factor rule that today\'s exercise drills. And inside the compose network, services reach each other by NAME: your app connects to host `db`, not localhost — the most common first-week-of-Docker confusion, resolved.',
      ],
      code: `services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/notes   # "db" = the service name!
      REDIS_URL: redis://cache:6379
      JWT_SECRET: change-me-in-real-life
    depends_on: [db, cache]
  db:
    image: postgres:16
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: notes }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  cache:
    image: redis:7

volumes:
  pgdata:`,
      codeTitle: 'docker-compose.yml — this file ships in the repo root',
      note: "This repo now contains a working Dockerfile + docker-compose.yml: if you install Docker Desktop, `docker compose up` boots the grader alongside a REAL Postgres and Redis — the infrastructure for your capstone graduation project, one command away.",
    },
    {
      h: 'The app-side contract (today’s exercise)',
      p: [
        'Containers make three demands of your code: **all config from env vars** (`process.env` — the runner injects APP_VERSION, NODE_ENV, DATABASE_URL exactly like `docker run -e`), **a health endpoint** for orchestrators to probe, and **no secrets in responses or logs** — the tests scan your `/config` output for the database password. Parse the URL with `new URL(...)`; expose the hostname, never the credentials.',
        'That closes the course loop: day 1 was a server on your laptop; day 18 is an app shaped to run anywhere. The FastAPI course (its day 17 is this same lesson, Python-flavored) and the capstone-with-real-infrastructure rebuild are your next moves.',
      ],
    },
  ],
  exercise: {
    brief: [
      'Read `APP_VERSION`, `NODE_ENV`, `DATABASE_URL` from `process.env` (the runner injects them container-style)',
      '`GET /healthz` → `{ "status": "ok", "version": <APP_VERSION> }`',
      '`GET /config` → `{ "env": <NODE_ENV>, "databaseHost": new URL(DATABASE_URL).hostname }`',
      'THE LEAK TEST: the db password (`s3cret`) must appear in no response, ever',
    ],
    hints: [
      '`new URL(url).hostname` gives the bare host — no regex needed',
      'Read env once at module level with `|| \'dev\'`-style fallbacks (TS: `?? \'dev\'` — process.env values are `string | undefined`)',
      'If the leak test fails you returned the raw URL somewhere — expose parsed fields only',
    ],
  },
  resources: [
    {
      title: 'Docker — Get started',
      url: 'https://docs.docker.com/get-started/',
      note: 'the official hands-on intro: images, containers, volumes',
    },
    {
      title: 'Docker — Node.js language guide',
      url: 'https://docs.docker.com/guides/nodejs/',
      note: 'containerizing Node specifically — layers, dev vs prod, debugging',
    },
    {
      title: 'Docker Compose — overview',
      url: 'https://docs.docker.com/compose/',
      note: 'multi-service stacks; the file in this repo is your worked example',
    },
    {
      title: 'The Twelve-Factor App — Config',
      url: 'https://12factor.net/config',
      note: 'the two-minute read behind "config lives in the environment"',
    },
  ],
} satisfies Lesson;

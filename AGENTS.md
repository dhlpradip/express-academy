# AGENTS.md

> Portable instructions for **any** AI coding agent (Cursor, Claude Code, Codex,
> Copilot, Windsurf, Zed, Gemini CLI, Aider, and others) working in this repo.
> This file is the single source of truth. Tool-specific files (CLAUDE.md,
> .cursor/rules, .github/copilot-instructions.md, ...) point back to it.

## How to work here

- **Read before you write.** Inspect the relevant files and follow existing
  patterns, naming, and structure. Match the surrounding code style.
- **Small, focused changes.** Prefer the minimal diff that solves the task. Do
  not refactor unrelated code or reformat files you were not asked to touch.
- **Plan complex work.** For anything non-trivial, outline the steps first, then
  implement. Keep the user informed of meaningful decisions.
- **Verify your work.** After changes, run the project's typecheck/lint/tests
  (see the commands in the project's own section) and fix what you broke.
- **No secrets in code.** Never hardcode API keys, tokens, or credentials. Read
  them from environment variables. Never commit `.env` files.
- **Ask only when blocked.** For naming, formatting, and equivalent approaches,
  pick a sensible default and note it. Ask before destructive or scope-changing
  actions.

## Golden rules

1. Correctness first, then clarity, then performance.
2. Fail loudly and early: validate inputs at boundaries, surface real errors.
3. Types are documentation. Keep them accurate and specific; avoid `any`.
4. No dead code, no commented-out blocks, no TODOs left behind without an issue.
5. Comments explain *why*, never *what*. Delete comments that narrate the code.
6. Every change should leave the codebase in a runnable, typechecking state.

## Provider / model agnostic

This project must not depend on any single AI vendor. When adding AI features:

- Keep model and provider choices behind a thin, swappable interface.
- Put model IDs, base URLs, and keys in environment variables, never inline.
- Default to widely-supported, documented APIs; avoid vendor lock-in features
  unless the task explicitly requires them.

## React (+ Vite + TypeScript)

- Function components with hooks only. No class components.
- One component per file; name the file after the component (`UserCard.tsx`).
- Type every prop with an explicit `interface`/`type`; no implicit `any`.
- Derive state, don't duplicate it. Keep a single source of truth and compute
  the rest during render (or `useMemo` when measurably expensive).
- Effects are for synchronizing with external systems only. If you can compute
  it during render or handle it in an event handler, do not use `useEffect`.
- Always provide stable, meaningful `key`s in lists (never the array index for
  dynamic lists).
- Data fetching: prefer a query library (TanStack Query) or the framework's
  loader over ad-hoc `useEffect` + `fetch`. Handle loading, empty, and error
  states explicitly.
- Accessibility is required: semantic elements, labelled controls, keyboard
  support, visible focus. Every interactive element must be reachable by keyboard.
- Keep components presentational; push side effects and business logic into
  hooks (`useX`) or plain modules.
- Memoize (`memo`/`useMemo`/`useCallback`) only to fix a measured problem.

### Common commands (adjust to this repo)

```bash
npm run dev         # start Vite dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
```

## Express (+ TypeScript)

- Structure by layer: `routes/` (HTTP) → `controllers/` (orchestration) →
  `services/` (business logic) → `repositories/`/models (data). Keep HTTP
  concerns out of services.
- Every route handler is `async` and wrapped so rejected promises reach the
  error middleware. Use `express-async-errors` or an `asyncHandler` wrapper —
  never leave an unhandled rejection.
- One centralized error-handling middleware `(err, req, res, next)` registered
  last. Return a consistent JSON error shape `{ error: { code, message } }` and
  the right status code. Do not leak stack traces in production.
- Validate and type request input (params, query, body) at the boundary with a
  schema validator (Zod/Joi) before touching business logic.
- Security middleware by default: `helmet`, `cors` (explicit allowlist), rate
  limiting on auth/public endpoints, and body-size limits.
- Config from environment via a validated config module; fail fast on startup if
  required env vars are missing.
- Auth: hash passwords with bcrypt/argon2; sign short-lived JWTs; keep secrets
  in env. Never log tokens or passwords.
- Return early, keep handlers thin, push logic into services that are unit
  testable without HTTP.

### Common commands (adjust to this repo)

```bash
npm run dev         # watch mode (tsx/nodemon)
npm run typecheck   # tsc --noEmit
npm test            # run tests
```

## Minimalism — the best code is the code you never wrote

Before writing code, stop at the **first rung that holds**. Only descend if the
one above genuinely doesn't apply:

1. **Does this need to exist?** → No: skip it (YAGNI).
2. **Already in this codebase?** → Reuse it; don't rewrite.
3. **Standard library does it?** → Use it.
4. **Native platform feature?** → Use it (e.g. `<input type="date">`, `fetch`).
5. **An installed dependency does it?** → Use it; don't reinvent.
6. **Can it be one line?** → Make it one line.
7. **Only then** → write the minimum that works.

Run the ladder *after* you understand the problem, not instead of it: read the
code the change touches and trace the real flow first. **Lazy about the
solution, never about reading.**

**Lazy, not negligent.** These are never cut to save lines: input/trust-boundary
validation, data-loss handling, security, error handling, and accessibility.

Prefer deleting code over adding it. Don't add abstraction, config, or options
for hypothetical futures. If asked for something the task doesn't need, say so.

_(Inspired by [ponytail](https://github.com/DietrichGebert/ponytail). For always-on
enforcement + a `/ponytail-review` delete-list, install the plugin — see
`agent-kit/RECOMMENDED-PLUGINS.md`.)_

## General engineering conventions

### Project layout & naming

- Keep modules small and single-purpose. One reason to change per file.
- Co-locate related code (component + styles + test) when the framework allows.
- Names describe intent, not type: `activeUsers`, not `arr` or `data2`.

### Git & commits

- Branch names: `feat/…`, `fix/…`, `chore/…`, `refactor/…`, `docs/…`.
- Commit messages: imperative mood, one logical change per commit.
  `feat(auth): add refresh-token rotation` — subject ≤ 72 chars, body explains
  the *why*.
- Never commit generated artifacts, `node_modules`, `.venv`, or secrets.
- Do not run `git push`, force-push, or amend published history unless asked.

### Error handling

- Validate at the edges (request handlers, CLI args, external responses).
- Throw/return typed, descriptive errors. Never swallow exceptions silently.
- Log actionable context, never secrets or full request bodies with PII.

### Security baseline

- Treat all external input as untrusted; validate and sanitize it.
- Parameterize database queries; never build SQL/NoSQL with string concat.
- Use environment variables for config; provide a committed `.env.example`.
- Keep dependencies current; avoid adding deps for trivial functionality.

### Testing

- Write tests for new logic and for every bug you fix (regression test first).
- Prefer fast, deterministic unit tests; reserve integration/e2e for critical
  paths. Test behavior and public contracts, not implementation details.
- A change is not done until the relevant checks pass locally.

### Documentation

- Update the README / relevant docs when behavior, setup, or commands change.
- Public functions and exported types get a one-line doc comment describing
  purpose, params, and return — only where intent isn't obvious from the name.

---
_Generated by agent-kit for `learn-express` (stacks: react express). Edit freely; re-run the installer with --force to regenerate._

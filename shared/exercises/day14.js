export default {
  id: 'day14',
  title: 'Capstone: a complete Notes API',
  starter: `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';
const users = new Map(); // username -> { username, passwordHash }
let notes = [];          // { id, title, content, owner }
let nextNoteId = 1;

// Build the whole thing. Everything from the last 13 days, one API.
//
// AUTH
//  POST /auth/register  { username, password }
//    - validate: username required (min 3 chars), password required (min 6 chars)
//      -> 400 { "errors": [ ...messages mentioning the field name... ] }
//    - duplicate username -> 409 { "error": "username taken" }
//    - success -> 201 { "username" }  (hash the password!)
//  POST /auth/login     { username, password }
//    - bad credentials -> 401 { "error": "invalid credentials" }
//    - success -> { "token" }  (JWT signed with JWT_SECRET, payload { username })
//
// NOTES — every route below requires a valid "Bearer <token>";
//         otherwise 401 { "error": "unauthorized" }
//  POST   /notes      { title, content? }
//    - missing title -> 400 { "errors": ["title is required"] }
//    - success -> 201 { id, title, content, owner: <username from the token> }
//  GET    /notes      -> ONLY the caller's own notes
//  GET    /notes/:id  -> 404 { "error": "note not found" } if no such note
//                        403 { "error": "forbidden" } if it belongs to someone else
//  DELETE /notes/:id  -> same 404/403 rules; success -> 204, no body
//
// EVERYTHING ELSE
//  - unknown routes -> 404 { "error": "route not found" }
//  - an error middleware so nothing ever crashes the process

module.exports = app;
`,
  solution: `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';
const users = new Map();
let notes = [];
let nextNoteId = 1;

// ---- auth ----

app.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  const errors = [];
  if (typeof username !== 'string' || username.length < 3) {
    errors.push('username must be at least 3 characters');
  }
  if (typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (errors.length > 0) return res.status(400).json({ errors });
  if (users.has(username)) return res.status(409).json({ error: 'username taken' });

  users.set(username, { username, passwordHash: bcrypt.hashSync(password, 10) });
  res.status(201).json({ username });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.get(username);
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' }) });
});

// ---- auth guard ----

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

// ---- notes ----

const notesRouter = express.Router();
notesRouter.use(requireAuth);

notesRouter.post('/', (req, res) => {
  const { title, content } = req.body || {};
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ errors: ['title is required'] });
  }
  const note = { id: nextNoteId++, title, content: content || '', owner: req.user.username };
  notes.push(note);
  res.status(201).json(note);
});

notesRouter.get('/', (req, res) => {
  res.json(notes.filter((n) => n.owner === req.user.username));
});

function loadNote(req, res, next) {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: 'note not found' });
  if (note.owner !== req.user.username) return res.status(403).json({ error: 'forbidden' });
  req.note = note;
  next();
}

notesRouter.get('/:id', loadNote, (req, res) => {
  res.json(req.note);
});

notesRouter.delete('/:id', loadNote, (req, res) => {
  notes = notes.filter((n) => n !== req.note);
  res.status(204).end();
});

app.use('/notes', notesRouter);

// ---- fallthrough + safety net ----

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
`,
  starterTs: `import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';

interface User {
  username: string;
  passwordHash: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  owner: string;
}

interface AuthedRequest extends express.Request {
  user?: { username: string };
  note?: Note;
}

const users = new Map<string, User>();
let notes: Note[] = [];
let nextNoteId = 1;

// Build the whole thing. Everything from the last 13 days, one API.
//
// AUTH
//  POST /auth/register  { username, password }
//    - validate: username min 3 chars, password min 6 chars
//      -> 400 { "errors": [ ...messages naming the field... ] }
//    - duplicate username -> 409 { "error": "username taken" }
//    - success -> 201 { "username" }  (hash the password!)
//  POST /auth/login     { username, password }
//    - bad credentials -> 401 { "error": "invalid credentials" }
//    - success -> { "token" }  (JWT signed with JWT_SECRET, payload { username })
//
// NOTES — every route requires a valid "Bearer <token>";
//         otherwise 401 { "error": "unauthorized" }
//  POST   /notes      { title, content? }
//    - missing title -> 400 { "errors": ["title is required"] }
//    - success -> 201 { id, title, content, owner: <username from the token> }
//  GET    /notes      -> ONLY the caller's own notes
//  GET    /notes/:id  -> 404 { "error": "note not found" } / 403 { "error": "forbidden" }
//  DELETE /notes/:id  -> same guards; success -> 204, no body
//
// EVERYTHING ELSE
//  - unknown routes -> 404 { "error": "route not found" }
//  - an error middleware so nothing ever crashes the process

export default app;
`,
  solutionTs: `import express, {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-secret';

interface User {
  username: string;
  passwordHash: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  owner: string;
}

interface AuthedRequest extends Request {
  user?: { username: string };
  note?: Note;
}

const users = new Map<string, User>();
let notes: Note[] = [];
let nextNoteId = 1;

// ---- auth ----

app.post('/auth/register', (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: unknown; password?: unknown };
  const errors: string[] = [];
  if (typeof username !== 'string' || username.length < 3) {
    errors.push('username must be at least 3 characters');
  }
  if (typeof password !== 'string' || password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (errors.length > 0) return res.status(400).json({ errors });
  if (users.has(username as string)) return res.status(409).json({ error: 'username taken' });

  users.set(username as string, {
    username: username as string,
    passwordHash: bcrypt.hashSync(password as string, 10),
  });
  res.status(201).json({ username });
});

app.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const user = username ? users.get(username) : undefined;
  if (!user || !password || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' }) });
});

// ---- auth guard ----

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as { username: string };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

// ---- notes ----

const notesRouter = Router();
notesRouter.use(requireAuth);

notesRouter.post('/', (req: AuthedRequest, res: Response) => {
  const { title, content } = (req.body ?? {}) as { title?: unknown; content?: unknown };
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ errors: ['title is required'] });
  }
  const note: Note = {
    id: nextNoteId++,
    title,
    content: typeof content === 'string' ? content : '',
    owner: req.user!.username,
  };
  notes.push(note);
  res.status(201).json(note);
});

notesRouter.get('/', (req: AuthedRequest, res: Response) => {
  res.json(notes.filter((n) => n.owner === req.user!.username));
});

function loadNote(req: AuthedRequest, res: Response, next: NextFunction): void {
  const note = notes.find((n) => n.id === Number(req.params.id));
  if (!note) {
    res.status(404).json({ error: 'note not found' });
    return;
  }
  if (note.owner !== req.user!.username) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  req.note = note;
  next();
}

notesRouter.get('/:id', loadNote, (req: AuthedRequest, res: Response) => {
  res.json(req.note);
});

notesRouter.delete('/:id', loadNote, (req: AuthedRequest, res: Response) => {
  notes = notes.filter((n) => n !== req.note);
  res.status(204).end();
});

app.use('/notes', notesRouter);

// ---- fallthrough + safety net ----

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

export default app;
`,
  tests: [
    {
      name: 'Register validates username AND password together',
      request: { method: 'POST', path: '/auth/register', json: { username: 'al', password: '123' } },
      expect: { status: 400, jsonHas: ['errors'], bodyContains: ['username', 'password'] },
    },
    {
      name: 'alice registers successfully',
      request: { method: 'POST', path: '/auth/register', json: { username: 'alice', password: 'wonderland' } },
      expect: { status: 201, json: { username: 'alice' } },
    },
    {
      name: 'A duplicate username is a 409',
      request: { method: 'POST', path: '/auth/register', json: { username: 'alice', password: 'whatever2' } },
      expect: { status: 409, json: { error: 'username taken' } },
    },
    {
      name: 'bob registers too',
      request: { method: 'POST', path: '/auth/register', json: { username: 'bob', password: 'builder99' } },
      expect: { status: 201 },
    },
    {
      name: 'alice logs in and receives a token',
      request: { method: 'POST', path: '/auth/login', json: { username: 'alice', password: 'wonderland' } },
      expect: { status: 200, jsonHas: ['token'] },
      save: { tokenA: 'json.token' },
    },
    {
      name: 'bob logs in and receives a token',
      request: { method: 'POST', path: '/auth/login', json: { username: 'bob', password: 'builder99' } },
      expect: { status: 200, jsonHas: ['token'] },
      save: { tokenB: 'json.token' },
    },
    {
      name: 'Creating a note without a token is a 401',
      request: { method: 'POST', path: '/notes', json: { title: 'Sneaky' } },
      expect: { status: 401, json: { error: 'unauthorized' } },
    },
    {
      name: 'alice creates a note; the owner comes from her token',
      request: {
        method: 'POST',
        path: '/notes',
        headers: { authorization: 'Bearer {{tokenA}}' },
        json: { title: 'Capstone plan', content: 'ship it' },
      },
      expect: { status: 201, json: { title: 'Capstone plan', content: 'ship it', owner: 'alice' }, jsonHas: ['id'] },
      save: { noteId: 'json.id' },
    },
    {
      name: 'A note without a title is rejected with 400',
      request: { method: 'POST', path: '/notes', headers: { authorization: 'Bearer {{tokenA}}' }, json: { content: 'no title' } },
      expect: { status: 400, jsonHas: ['errors'] },
    },
    {
      name: 'alice sees exactly her one note',
      request: { method: 'GET', path: '/notes', headers: { authorization: 'Bearer {{tokenA}}' } },
      expect: { status: 200, jsonLength: 1 },
    },
    {
      name: "bob's list is empty — he can't see alice's notes",
      request: { method: 'GET', path: '/notes', headers: { authorization: 'Bearer {{tokenB}}' } },
      expect: { status: 200, jsonLength: 0 },
    },
    {
      name: "bob reading alice's note by id is a 403, not a 404",
      request: { method: 'GET', path: '/notes/{{noteId}}', headers: { authorization: 'Bearer {{tokenB}}' } },
      expect: { status: 403, json: { error: 'forbidden' } },
    },
    {
      name: "bob can't delete it either",
      request: { method: 'DELETE', path: '/notes/{{noteId}}', headers: { authorization: 'Bearer {{tokenB}}' } },
      expect: { status: 403 },
    },
    {
      name: 'alice deletes her own note (204)',
      request: { method: 'DELETE', path: '/notes/{{noteId}}', headers: { authorization: 'Bearer {{tokenA}}' } },
      expect: { status: 204 },
    },
    {
      name: 'The deleted note is now a 404',
      request: { method: 'GET', path: '/notes/{{noteId}}', headers: { authorization: 'Bearer {{tokenA}}' } },
      expect: { status: 404, json: { error: 'note not found' } },
    },
    {
      name: 'Unknown routes return the JSON 404',
      request: { method: 'GET', path: '/definitely/not/here' },
      expect: { status: 404, json: { error: 'route not found' } },
    },
  ],
};

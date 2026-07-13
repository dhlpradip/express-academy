/** @type {import('./index.js').Exercise} */
export default {
  id: 'day05',
  title: 'A full REST resource: /todos',
  starter: `const express = require('express');
const app = express();

app.use(express.json());

// In-memory "database" — fine for learning, gone on restart (day 9 fixes that).
let todos = [];
let nextId = 1;

// TODO — implement the classic five:
//
// GET    /todos        -> 200, JSON array of all todos
// POST   /todos        -> 201, create { id, title, done: false } from body.title
// GET    /todos/:id    -> 200 with the todo, or 404 { "error": "not found" }
// PATCH  /todos/:id    -> 200, merge body fields into the todo, or 404
// DELETE /todos/:id    -> 204 with NO body, or 404
//
// Hint: req.params.id is a STRING; your ids are numbers. Compare carefully.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

app.use(express.json());

let todos = [];
let nextId = 1;

function findTodo(id) {
  return todos.find((t) => t.id === Number(id));
}

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const todo = { id: nextId++, title: req.body.title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.get('/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  res.json(todo);
});

app.patch('/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  Object.assign(todo, req.body);
  res.json(todo);
});

app.delete('/todos/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  todos = todos.filter((t) => t !== todo);
  res.status(204).end();
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();
app.use(express.json());

// Model your data — this is where TS starts paying off:
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

let todos: Todo[] = [];
let nextId = 1;

// TODO — implement the classic five:
//
// GET    /todos        -> 200, JSON array of all todos
// POST   /todos        -> 201, create { id, title, done: false } from body.title
// GET    /todos/:id    -> 200 with the todo, or 404 { "error": "not found" }
// PATCH  /todos/:id    -> 200, merge body fields into the todo, or 404
// DELETE /todos/:id    -> 204 with NO body, or 404
//
// Hint: req.params.id is a STRING; Todo.id is a number. Number(...) it.
// Hint: a findTodo(id: string): Todo | undefined helper keeps it DRY.

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();
app.use(express.json());

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

let todos: Todo[] = [];
let nextId = 1;

function findTodo(id: string): Todo | undefined {
  return todos.find((t) => t.id === Number(id));
}

app.get('/todos', (req: Request, res: Response) => {
  res.json(todos);
});

app.post('/todos', (req: Request, res: Response) => {
  const todo: Todo = { id: nextId++, title: req.body.title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.get('/todos/:id', (req: Request, res: Response) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  res.json(todo);
});

app.patch('/todos/:id', (req: Request, res: Response) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  Object.assign(todo, req.body);
  res.json(todo);
});

app.delete('/todos/:id', (req: Request, res: Response) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  todos = todos.filter((t) => t !== todo);
  res.status(204).end();
});

export default app;
`,
  tests: [
    {
      name: 'GET /todos starts as an empty array',
      request: { method: 'GET', path: '/todos' },
      expect: { status: 200, jsonLength: 0 },
    },
    {
      name: 'POST /todos creates a todo (201, done defaults to false)',
      request: { method: 'POST', path: '/todos', json: { title: 'Learn Express' } },
      expect: { status: 201, json: { title: 'Learn Express', done: false }, jsonHas: ['id'] },
      save: { todoId: 'json.id' },
    },
    {
      name: 'GET /todos/:id fetches the created todo',
      request: { method: 'GET', path: '/todos/{{todoId}}' },
      expect: { status: 200, json: { title: 'Learn Express', done: false } },
    },
    {
      name: 'PATCH /todos/:id updates just the given fields',
      request: { method: 'PATCH', path: '/todos/{{todoId}}', json: { done: true } },
      expect: { status: 200, json: { title: 'Learn Express', done: true } },
    },
    {
      name: 'The collection now has exactly one todo',
      request: { method: 'GET', path: '/todos' },
      expect: { status: 200, jsonLength: 1 },
    },
    {
      name: 'DELETE /todos/:id responds 204 with no body',
      request: { method: 'DELETE', path: '/todos/{{todoId}}' },
      expect: { status: 204 },
    },
    {
      name: 'The deleted todo is gone (404 "not found")',
      request: { method: 'GET', path: '/todos/{{todoId}}' },
      expect: { status: 404, json: { error: 'not found' } },
    },
    {
      name: 'PATCH on a missing todo is a 404, not a crash',
      request: { method: 'PATCH', path: '/todos/9999', json: { done: true } },
      expect: { status: 404 },
    },
  ],
};

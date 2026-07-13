/** @type {import('./index.js').Exercise} */
export default {
  id: 'day12',
  title: 'Serving files: content types and downloads',
  starter: `const express = require('express');
const app = express();

// An in-memory "file system" (real disks work the same, via express.static/multer).
const files = {
  'report.pdf': { type: 'application/pdf', content: 'PDF-1.4 fake report bytes' },
  'notes.txt': { type: 'text/plain', content: 'remember to hydrate' },
};

// TODO 1: GET /files
//   -> JSON array of the file names: Object.keys(files)

// TODO 2: GET /files/:name
//   - unknown name -> 404 { "error": "file not found" }
//   - otherwise set the Content-Type header to the file's type
//     and send the file's content
//   Hint: res.type(...) or res.set('Content-Type', ...)

// TODO 3: GET /files/:name/download
//   - same as above, but ALSO set:
//       Content-Disposition: attachment; filename="<name>"
//     which tells the browser to download instead of display.

module.exports = app;
`,
  solution: `const express = require('express');
const app = express();

const files = {
  'report.pdf': { type: 'application/pdf', content: 'PDF-1.4 fake report bytes' },
  'notes.txt': { type: 'text/plain', content: 'remember to hydrate' },
};

app.get('/files', (req, res) => {
  res.json(Object.keys(files));
});

app.get('/files/:name', (req, res) => {
  const file = files[req.params.name];
  if (!file) return res.status(404).json({ error: 'file not found' });
  res.set('Content-Type', file.type);
  res.send(file.content);
});

app.get('/files/:name/download', (req, res) => {
  const file = files[req.params.name];
  if (!file) return res.status(404).json({ error: 'file not found' });
  res.set('Content-Type', file.type);
  res.set('Content-Disposition', \`attachment; filename="\${req.params.name}"\`);
  res.send(file.content);
});

module.exports = app;
`,
  starterTs: `import express from 'express';

const app = express();

// An in-memory "file system" (real disks work the same, via express.static/multer).
interface StoredFile {
  type: string;
  content: string;
}

const files: Record<string, StoredFile> = {
  'report.pdf': { type: 'application/pdf', content: 'PDF-1.4 fake report bytes' },
  'notes.txt': { type: 'text/plain', content: 'remember to hydrate' },
};

// TODO 1: GET /files -> JSON array of file names (Object.keys(files))

// TODO 2: GET /files/:name
//   - unknown -> 404 { "error": "file not found" }
//   - else set Content-Type to the file's type, send its content
//   TS note: files[req.params.name] is StoredFile | undefined — the guard narrows it.

// TODO 3: GET /files/:name/download
//   - same, plus Content-Disposition: attachment; filename="<name>"

export default app;
`,
  solutionTs: `import express, { type Request, type Response } from 'express';

const app = express();

interface StoredFile {
  type: string;
  content: string;
}

const files: Record<string, StoredFile> = {
  'report.pdf': { type: 'application/pdf', content: 'PDF-1.4 fake report bytes' },
  'notes.txt': { type: 'text/plain', content: 'remember to hydrate' },
};

app.get('/files', (req: Request, res: Response) => {
  res.json(Object.keys(files));
});

app.get('/files/:name', (req: Request, res: Response) => {
  const file = files[req.params.name]; // StoredFile | undefined
  if (!file) return res.status(404).json({ error: 'file not found' });
  res.set('Content-Type', file.type);
  res.send(file.content);
});

app.get('/files/:name/download', (req: Request, res: Response) => {
  const file = files[req.params.name];
  if (!file) return res.status(404).json({ error: 'file not found' });
  res.set('Content-Type', file.type);
  res.set('Content-Disposition', \`attachment; filename="\${req.params.name}"\`);
  res.send(file.content);
});

export default app;
`,
  tests: [
    {
      name: 'GET /files lists both file names',
      request: { method: 'GET', path: '/files' },
      expect: { status: 200, json: ['report.pdf', 'notes.txt'] },
    },
    {
      name: 'notes.txt is served as text/plain with its content',
      request: { method: 'GET', path: '/files/notes.txt' },
      expect: { status: 200, bodyContains: 'remember to hydrate', headers: { 'content-type': 'text/plain' } },
    },
    {
      name: 'report.pdf is served as application/pdf',
      request: { method: 'GET', path: '/files/report.pdf' },
      expect: { status: 200, headers: { 'content-type': 'application/pdf' } },
    },
    {
      name: 'An unknown file is a 404',
      request: { method: 'GET', path: '/files/missing.doc' },
      expect: { status: 404, json: { error: 'file not found' } },
    },
    {
      name: 'The download route sets Content-Disposition: attachment',
      request: { method: 'GET', path: '/files/report.pdf/download' },
      expect: { status: 200, headers: { 'content-disposition': 'attachment; filename="report.pdf"' } },
    },
    {
      name: 'Downloading an unknown file is also a 404',
      request: { method: 'GET', path: '/files/ghost.txt/download' },
      expect: { status: 404 },
    },
  ],
};

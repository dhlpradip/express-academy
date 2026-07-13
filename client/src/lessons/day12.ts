import type { Lesson } from './types.ts';

export default {
  day: 12,
  id: 'day12',
  arc: 'Production',
  minutes: 45,
  title: 'Serving files: content types and downloads',
  summary: 'Content-Type, Content-Disposition, express.static, and where uploads fit',
  intro:
    "APIs don't only speak JSON — they serve images, PDFs, exports, and the built frontend itself. The interesting part isn't reading bytes; it's the headers that tell the browser what the bytes are and what to do with them. You've been on the receiving end of these headers with every download button you've ever built.",
  sections: [
    {
      h: 'Content-Type decides everything',
      p: [
        'The browser doesn\'t sniff files — it obeys the `Content-Type` header. The same bytes render as a page with `text/html`, display as text with `text/plain`, and download as a mystery blob with `application/octet-stream`. Serving a file means: look up its MIME type, set the header, send the bytes.',
        '`Content-Disposition` is the second lever: `attachment; filename="report.pdf"` tells the browser to *download* rather than display, and what to name the file. That\'s the entire secret behind every "Export as CSV" button.',
      ],
      code: `app.get('/files/:name/download', (req, res) => {
  const file = files[req.params.name];
  if (!file) return res.status(404).json({ error: 'file not found' });

  res.set('Content-Type', file.type);
  res.set('Content-Disposition', \`attachment; filename="\${req.params.name}"\`);
  res.send(file.content);
});`,
      codeTitle: 'download.js',
    },
    {
      h: 'Real files on disk: the shortcuts',
      p: [
        'For actual files Express has batteries included. `app.use(express.static(\'public\'))` serves a whole directory with correct MIME types, caching headers, and range requests — it\'s how an Express app serves your built React bundle in production. For a single file there\'s `res.sendFile(path)` and the download shorthand `res.download(path, name)` which sets Content-Disposition for you.',
      ],
      code: `// Serving a built React app from Express — you'll do this someday soon:
app.use(express.static('client/dist'));

// SPA fallback: every non-API route returns index.html,
// so React Router handles /whatever client-side
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});`,
      codeTitle: 'spa-serving.js — the classic full-stack deployment shape',
    },
    {
      h: 'Uploads, briefly',
      p: [
        'Uploads arrive as `multipart/form-data`, which `express.json()` can\'t parse — the standard tool is **multer** middleware: it extracts uploaded files onto disk or memory and hands you metadata on `req.file`. Two production rules: always limit file size (`limits: { fileSize }`) and never trust the client\'s claimed MIME type or filename — validate server-side, generate your own storage names. At scale, files go to S3-style object storage, not the app server\'s disk.',
      ],
      note: "Today's exercise uses an in-memory file store so the tests are deterministic — the header logic is identical for disk files, which express.static handles for you anyway. The headers ARE the lesson.",
    },
  ],
  exercise: {
    brief: [
      '`GET /files` → JSON array of the file names (`Object.keys(files)`)',
      '`GET /files/:name` → set `Content-Type` from the file\'s `type`, send its `content`; unknown name → 404 `{ "error": "file not found" }`',
      '`GET /files/:name/download` → same, plus `Content-Disposition: attachment; filename="<name>"`',
    ],
    hints: [
      'Files live in an object, so lookup is `files[req.params.name]`',
      'Template literal with escaped quotes for the disposition: `` `attachment; filename="${req.params.name}"` ``',
      'Both :name routes need the same 404 guard — feel free to share a helper or middleware',
    ],
  },
} satisfies Lesson;

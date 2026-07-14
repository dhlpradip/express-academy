import type { Lesson } from './types.ts';

export default {
  day: 7,
  id: 'day07',
  arc: 'Building APIs',
  minutes: 50,
  title: 'Validate everything that crosses the wire',
  summary: 'Input validation, useful 400s, and why the server never trusts the client',
  intro:
    "Here's the mindset shift: your beautiful React form with all its client-side validation? The server must assume it doesn't exist. Anyone with curl can hit your API with any payload imaginable. Client validation is UX; **server validation is security and data integrity** — and only one of them is optional.",
  sections: [
    {
      h: 'What can go wrong, goes wrong',
      p: [
        'Fields can be missing, `null`, the wrong type (`"25"` where you need `25`), out of range, absurdly long, or extra fields you never asked for. A request body is just attacker-controlled text that happened to parse as JSON. Validate shape, types, and ranges before the data touches your logic or your database.',
      ],
    },
    {
      h: 'Collect errors, don\'t bail on the first',
      p: [
        "You know this from form UX: showing one error at a time infuriates users. The API version is identical — validate every field, accumulate messages into an array, respond once with all of them. Each message should name the field and state the rule, so the frontend developer consuming your API (soon: you, wearing the other hat) can fix their payload in one round trip.",
      ],
      code: `function validateSignup(body) {
  const errors = [];
  const { username, email, age } = body;

  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    errors.push('username must be a string of 3 to 20 characters');
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    errors.push('email must be a valid email address');
  }
  // optional field: only validate when present
  if (age !== undefined && (typeof age !== 'number' || age < 13)) {
    errors.push('age must be a number of at least 13');
  }
  return errors;
}

app.post('/signup', (req, res) => {
  const errors = validateSignup(req.body || {});
  if (errors.length > 0) return res.status(400).json({ errors });
  // ...only now is req.body safe to use
});`,
      codeTitle: 'validate.js',
      note: 'Note the `typeof` checks. `"25"` and `25` both look fine in a console.log, but only one of them survives `age < 13` with sane semantics. JSON has types; enforce them.',
    },
    {
      h: 'In real projects: schema validators',
      p: [
        'Hand-rolled validation teaches the concepts, but production code uses schema libraries — **zod** (the TypeScript-world favorite you may already know from React Hook Form), **joi**, or **express-validator**. Same idea, declarative: define the schema once, get parsing + validation + error messages, and share the schema with your frontend for end-to-end type safety. Today you hand-roll it so the library never feels like magic.',
      ],
      code: `// The same thing with zod, for flavor (not needed in the exercise):
const SignupSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(13).optional(),
});

app.post('/signup', (req, res) => {
  const result = SignupSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.issues });
  // result.data is typed AND validated
});`,
      codeTitle: 'zod-flavor.js',
    },
  ],
  exercise: {
    brief: [
      '`POST /signup` with rules: `username` string 3–20 chars; `email` string containing `@`; `age` optional, but if present a number ≥ 13',
      'Invalid → 400 `{ "errors": [...] }` collecting ALL problems, each message mentioning the field name',
      'Valid → 201 `{ "username": ..., "email": ... }`',
    ],
    hints: [
      'Build the errors array first; only respond when you\'ve checked everything',
      'The optional-field pattern: `if (age !== undefined && ...)`',
      'Guard against a missing body: `req.body || {}` before destructuring',
      '`typeof age !== \'number\'` catches the string-"25" case the test sends',
    ],
  },
  resources: [
    {
      title: "Zod",
      url: "https://zod.dev",
      note: "the schema validator you will actually use; pairs perfectly with TypeScript",
    },
    {
      title: "express-validator",
      url: "https://express-validator.github.io/docs/",
      note: "the middleware-flavored alternative, common in older codebases",
    },
    {
      title: "OWASP — Input Validation Cheat Sheet",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
      note: "validation as a security discipline, not just UX",
    },
  ],
} satisfies Lesson;

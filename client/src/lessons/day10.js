export default {
  day: 10,
  id: 'day10',
  arc: 'Production',
  minutes: 75,
  title: 'Authentication with JWT',
  summary: 'Password hashing, tokens, and the auth middleware — the #1 interview topic',
  intro:
    "You've written `Authorization: Bearer ${token}` into fetch headers for years. Today you build the machine that mints and verifies those tokens. Auth is the most asked-about backend topic in interviews and the most dangerous to get wrong in production — the rules here are non-negotiable.",
  sections: [
    {
      h: 'Rule zero: never store passwords',
      p: [
        'You store a **hash** — the output of a deliberately slow one-way function. `bcrypt.hashSync(password, 10)` produces a string that cannot be reversed to the password; login re-hashes the attempt and compares with `bcrypt.compareSync`. When (not if) a database leaks, hashed passwords buy your users time; plaintext ones end careers.',
        'Why bcrypt and not `crypto.createHash(\'sha256\')`? Speed, ironically: SHA-256 is fast, so attackers can try billions of guesses per second. bcrypt is engineered to be slow, with a tunable cost factor (that `10`). Modern alternative: argon2. Never: MD5, SHA-anything, or your own invention.',
      ],
      code: `const bcrypt = require('bcryptjs');

// register
const passwordHash = bcrypt.hashSync(password, 10);
users.set(username, { username, passwordHash });

// login
const ok = user && bcrypt.compareSync(attempt, user.passwordHash);`,
      codeTitle: 'hashing.js',
    },
    {
      h: 'Sessions vs JWT — the eternal question',
      p: [
        '**Sessions**: the server stores who\'s logged in and gives the browser an opaque cookie id. Revocable instantly, but requires shared session storage across servers. **JWT**: the server stores nothing; it signs a token containing the claims (`{ username }`) and later verifies the signature. Stateless and horizontally scalable, but can\'t be revoked before expiry — which is why tokens are short-lived.',
        "A JWT is three base64 sections: header.payload.signature. Crucial and interview-loved: the payload is **readable by anyone** (base64 is encoding, not encryption) — never put secrets in it. The signature only proves it hasn't been *modified* by someone without your secret key.",
      ],
      code: `const jwt = require('jsonwebtoken');

// mint at login — payload, secret, options:
const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

// verify on protected requests — throws if forged or expired:
const payload = jwt.verify(token, JWT_SECRET); // { username, iat, exp }`,
      codeTitle: 'jwt.js',
      note: 'The secret is the crown jewels: anyone holding it can mint valid tokens for any user. Real apps read it from `process.env.JWT_SECRET`, never from source code. We hardcode `dev-secret` here only because the exercise runs sandboxed.',
    },
    {
      h: 'The auth middleware',
      p: [
        'Day 3\'s guard pattern, fully grown: parse the `Authorization: Bearer <token>` header, verify inside try/catch (verify *throws* on bad tokens — treat that as a normal 401, not an error), attach the payload to `req.user`, and let handlers downstream simply read who\'s calling. One middleware, every protected route, single source of truth.',
      ],
      code: `function requireAuth(req, res, next) {
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
}`,
      codeTitle: 'require-auth.js',
    },
  ],
  exercise: {
    brief: [
      '`POST /auth/register` `{ username, password }` → duplicate username: 409 `{ "error": "username taken" }`; else hash with bcrypt, store, 201 `{ "username" }` — never return the hash',
      '`POST /auth/login` → bad user or password: 401 `{ "error": "invalid credentials" }`; success: `{ "token" }` signed with secret `dev-secret`, payload `{ username }`',
      'A `requireAuth` middleware implementing the Bearer flow above',
      '`GET /me` (protected) → `{ "username": req.user.username }`',
    ],
    hints: [
      '`bcryptjs` and `jsonwebtoken` are pre-installed — the starter already requires them',
      'Use the same 401 message for unknown-user and wrong-password: telling attackers which usernames exist is an info leak',
      '`jwt.verify` THROWS on invalid tokens — that\'s why the try/catch is mandatory',
      'The forged-token test sends `Bearer not.a.realtoken` — your try/catch handles it with zero extra code',
    ],
  },
};

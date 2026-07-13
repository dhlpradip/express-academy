export default {
  day: 13,
  id: 'day13',
  arc: 'Production',
  minutes: 55,
  title: 'Async patterns under pressure',
  summary: 'Parallel awaits, mapping upstream failures, and how APIs get tested',
  intro:
    "Real handlers rarely await one thing. They call a database AND a cache AND another service, and any of them can be slow or down. Today: making concurrent calls actually concurrent, turning upstream failures into honest status codes — and a look at how the grader you've been using all week works, because it's how you'll test your own APIs.",
  sections: [
    {
      h: 'Sequential awaits are a silent tax',
      p: [
        'Two awaits in a row run one **after** the other — two 150ms calls cost 300ms. If the calls don\'t depend on each other, start both, then await both: `Promise.all` brings the cost back to 150ms. You know this from firing parallel fetches in a `useEffect`; on the server it\'s more urgent because the latency is paid by *every single request*, multiplied across your traffic.',
      ],
      code: `// ❌ 300ms — the second call waits for the first for no reason
const temp = await getTemperature();
const humidity = await getHumidity();

// ✅ 150ms — both start immediately, resolve together
const [temp, humidity] = await Promise.all([getTemperature(), getHumidity()]);`,
      codeTitle: 'parallel.js',
      note: "`Promise.all` rejects if ANY promise rejects — usually what you want (with asyncHandler catching it). When partial success is acceptable — three widgets, one may fail — use `Promise.allSettled` and inspect each result.",
    },
    {
      h: 'Map failures to honest status codes',
      p: [
        "When a service *you call* fails, a generic 500 says \"I crashed.\" **502 Bad Gateway** says \"my dependency failed\" — a distinction your ops dashboards, retry logic, and 3am-you will thank you for. Similar cases: 503 (overloaded/maintenance), 504 (upstream timeout).",
        'The pattern: try/catch around the specific upstream call, choose the status by what failed. This is finer-grained than the day 6 global handler — the safety net is for the unexpected; *expected* failure modes deserve deliberate mapping.',
      ],
      code: `app.get('/dashboard', async (req, res) => {
  try {
    const data = await paymentProvider.getBalance();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message }); // "not my fault, but I'm honest"
  }
});`,
      codeTitle: 'upstream.js',
    },
    {
      h: 'How APIs get tested (including by this course)',
      p: [
        'The standard tool is **supertest**: import your Express app (never .listen()ed — day 1\'s pattern pays off), and it fires real HTTP requests through the whole middleware stack. These integration tests catch what unit tests can\'t: wrong middleware order, missing parsers, broken error handling.',
        "This course's grader is the same idea, homemade: your submitted code runs in a child process, `app.listen(0)` grabs a random free port, and each test is a `fetch` with assertions on status, body, and headers. Read `server/src/child-runner.cjs` in this project after class — you now know every concept in it.",
      ],
      code: `// supertest, in the shape you'd write at work:
const request = require('supertest');
const app = require('../src/app');

test('POST /todos creates a todo', async () => {
  const res = await request(app)
    .post('/todos')
    .send({ title: 'write tests' })
    .expect(201);

  expect(res.body.title).toBe('write tests');
});`,
      codeTitle: 'todos.test.js',
    },
  ],
  exercise: {
    brief: [
      '`GET /weather` → call the provided `getTemperature()` and `getHumidity()` IN PARALLEL, respond `{ "temp": 21, "humidity": 60 }` — there is a test asserting the response arrives in ~150ms, so sequential awaits fail',
      '`GET /crash-test` → call the provided `flakyService()` in try/catch; when it throws, respond **502** `{ "error": "service down" }`',
    ],
    hints: [
      'Destructure straight from Promise.all: `const [temp, humidity] = await Promise.all([...])`',
      'Pass the function references — `Promise.all([getTemperature(), getHumidity()])` calls both immediately, which is exactly the point',
      'The 502 case is a LOCAL try/catch with a chosen status — not the global error middleware',
    ],
  },
};

import express from 'express';
import cors from 'cors';
import { exercises } from '@academy/shared/exercises';
import { runAttempt, type Language } from './runner.js';

const app = express();
const PORT = 4600;

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', exercises: Object.keys(exercises).length });
});

app.post('/api/run', async (req, res, next) => {
  try {
    const { exerciseId, code, language } = (req.body ?? {}) as {
      exerciseId?: string;
      code?: string;
      language?: Language;
    };
    const exercise = exercises[exerciseId ?? ''];
    if (!exercise) {
      return res.status(404).json({ error: `unknown exercise "${exerciseId}"` });
    }
    if (typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ error: 'code is required' });
    }
    const lang: Language = language === 'ts' ? 'ts' : 'js';
    const outcome = await runAttempt(exercise, code, lang);
    res.json(outcome);
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => res.status(404).json({ error: 'route not found' }));

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal error: ' + err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`express-academy grader listening on http://127.0.0.1:${PORT}`);
});

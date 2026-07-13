import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Exercise } from '@academy/shared/exercises';
import { runExercise, type RunOutcome } from '../api.ts';
import {
  useProgress,
  savedCodeKey,
  loadLanguage,
  saveLanguage,
  type Language,
} from '../progress.tsx';
import { fmt } from '../format.tsx';
import type { Lesson } from '../lessons/index.ts';
import CodeBlock from './CodeBlock.tsx';
import TestLog from './TestLog.tsx';

interface ExercisePanelProps {
  lesson: Lesson;
  exercise: Exercise;
  nextDay: number | null;
}

function starterFor(exercise: Exercise, language: Language): string {
  return language === 'ts' ? exercise.starterTs : exercise.starter;
}

export default function ExercisePanel({ lesson, exercise, nextDay }: ExercisePanelProps) {
  const { markComplete } = useProgress();
  const [language, setLanguage] = useState<Language>(loadLanguage);
  const [code, setCode] = useState<string>(
    () => localStorage.getItem(savedCodeKey(exercise.id, loadLanguage())) ?? starterFor(exercise, loadLanguage())
  );
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  function onChange(value: string) {
    setCode(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => localStorage.setItem(savedCodeKey(exercise.id, language), value), 400);
  }

  function switchLanguage(next: Language) {
    if (next === language) return;
    // Park the current buffer, then restore whatever you had going in the other language.
    localStorage.setItem(savedCodeKey(exercise.id, language), code);
    setLanguage(next);
    saveLanguage(next);
    setCode(localStorage.getItem(savedCodeKey(exercise.id, next)) ?? starterFor(exercise, next));
    setOutcome(null);
    setError(null);
  }

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const result = await runExercise(exercise.id, code, language);
      setOutcome(result);
      const allPass = !result.fatal && !!result.results?.length && result.results.every((r) => r.pass);
      if (allPass) markComplete(exercise.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    const starter = starterFor(exercise, language);
    setCode(starter);
    localStorage.setItem(savedCodeKey(exercise.id, language), starter);
    setOutcome(null);
  }

  const allPass = !!outcome && !outcome.fatal && !!outcome.results?.length && outcome.results.every((r) => r.pass);
  const solution = language === 'ts' ? exercise.solutionTs : exercise.solution;

  return (
    <section className="exercise" aria-label="Exercise">
      <div className="exercise-head">
        <div className="exercise-head-row">
          <div>
            <div className="eyebrow">
              Exercise<span className="sep">·</span>
              {exercise.tests.length} tests must pass
            </div>
            <h2>{exercise.title}</h2>
          </div>
          <div className="lang-toggle" role="radiogroup" aria-label="Exercise language">
            <button
              className={`lang-btn${language === 'js' ? ' on' : ''}`}
              role="radio"
              aria-checked={language === 'js'}
              onClick={() => switchLanguage('js')}
            >
              JS
            </button>
            <button
              className={`lang-btn${language === 'ts' ? ' on' : ''}`}
              role="radio"
              aria-checked={language === 'ts'}
              onClick={() => switchLanguage('ts')}
            >
              TS
            </button>
          </div>
        </div>
      </div>

      <div className="exercise-body">
        <ul className="exercise-brief">
          {lesson.exercise.brief.map((line, i) => (
            <li key={i}>{fmt(line)}</li>
          ))}
        </ul>

        {language === 'ts' && (
          <p className="lang-note">
            TypeScript mode: use <code>import</code>/<code>export default app</code>. The grader strips types and
            tests behavior — for real type errors, open this code in VS Code.
          </p>
        )}

        {lesson.exercise.hints.length > 0 && (
          <details className="hints">
            <summary>STUCK? SHOW HINTS ({lesson.exercise.hints.length})</summary>
            <ul>
              {lesson.exercise.hints.map((h, i) => (
                <li key={i}>{fmt(h)}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="editor-shell">
          <CodeMirror
            value={code}
            onChange={onChange}
            theme={oneDark}
            extensions={[javascript({ typescript: language === 'ts' })]}
            basicSetup={{ highlightSelectionMatches: false }}
          />
        </div>

        <div className="exercise-actions">
          <button className="btn btn-run" onClick={run} disabled={running}>
            {running ? 'RUNNING…' : '▶ RUN TESTS'}
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            RESET TO STARTER
          </button>
        </div>

        {error && (
          <div className="testlog">
            <div className="fatal">
              Could not reach the grader: {error}
              {'\n'}Is the server running? Start everything with `npm run dev` from the project root.
            </div>
          </div>
        )}

        <TestLog outcome={outcome} tests={exercise.tests} />

        {allPass && (
          <div className="success-banner">
            <span className="code200">200 OK</span>
            <span className="msg">Day {lesson.day} complete — every test passed.</span>
            {nextDay && (
              <Link className="btn-cta" to={`/day/${nextDay}`}>
                Day {nextDay} →
              </Link>
            )}
          </div>
        )}

        <details className="solution-reveal">
          <summary>REVEAL THE REFERENCE SOLUTION ({language.toUpperCase()})</summary>
          <p className="solution-note">
            Try for at least 15 minutes before peeking — the struggle is where the learning happens. If you do peek,
            close it and rewrite from memory.
          </p>
          <CodeBlock code={solution} title={language === 'ts' ? 'solution.ts' : 'solution.js'} typescript={language === 'ts'} />
        </details>
      </div>
    </section>
  );
}

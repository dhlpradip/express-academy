import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { lessons } from '../lessons/index.ts';
import { exercises } from '@academy/shared/exercises';
import CodeBlock from '../components/CodeBlock.tsx';
import ExercisePanel from '../components/ExercisePanel.tsx';
import { fmt } from '../format.tsx';
import { useProgress } from '../progress.tsx';

export default function Lesson() {
  const { day } = useParams();
  const dayNum = Number(day);
  const lesson = lessons[dayNum - 1];
  const { unlockedDay } = useProgress();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [dayNum]);

  if (!lesson) return <Navigate to="/" replace />;
  // No skipping ahead: deep links to locked days bounce back to the frontier.
  if (dayNum > unlockedDay) return <Navigate to={`/day/${unlockedDay}`} replace />;

  const exercise = exercises[lesson.id];
  const nextDay = dayNum < lessons.length ? dayNum + 1 : null;
  const prevDay = dayNum > 1 ? dayNum - 1 : null;

  return (
    <article>
      <div className="eyebrow">
        Day {String(dayNum).padStart(2, '0')}
        <span className="sep">·</span>
        {lesson.arc}
        <span className="sep">·</span>~{lesson.minutes} min
      </div>
      <h1 className="lesson-title">{lesson.title}</h1>
      <p className="lesson-intro">{fmt(lesson.intro)}</p>

      {lesson.sections.map((section, i) => (
        <section className="section" key={i}>
          {section.h && <h2>{section.h}</h2>}
          {(section.p ?? []).map((para, j) => (
            <p key={j}>{fmt(para)}</p>
          ))}
          {section.code && <CodeBlock code={section.code} title={section.codeTitle} />}
          {section.note && <div className="note">{fmt(section.note)}</div>}
        </section>
      ))}

      {/* Keyed by exercise so navigating between days remounts the panel —
          otherwise React reuses the instance and the previous day's editor
          buffer, results, and revealed solution linger. */}
      <ExercisePanel key={exercise.id} lesson={lesson} exercise={exercise} nextDay={nextDay} />

      <nav className="lesson-nav">
        <span>{prevDay && <Link to={`/day/${prevDay}`}>← Day {String(prevDay).padStart(2, '0')}</Link>}</span>
        <span>
          {nextDay &&
            (nextDay <= unlockedDay ? (
              <Link to={`/day/${nextDay}`}>Day {String(nextDay).padStart(2, '0')} →</Link>
            ) : (
              <span className="nav-locked" title="Pass this day's exercise to unlock">
                Day {String(nextDay).padStart(2, '0')} — 403
              </span>
            ))}
        </span>
      </nav>
    </article>
  );
}

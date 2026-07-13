import React from 'react';
import { Link } from 'react-router-dom';
import { lessons } from '../lessons/index.ts';
import { useProgress } from '../progress.tsx';

const arcs = [
  { name: 'Week 1 — Foundations', days: [1, 2, 3, 4] },
  { name: 'Week 1–2 — Building APIs', days: [5, 6, 7, 8, 9] },
  { name: 'Week 2 — Production', days: [10, 11, 12, 13, 14] },
  { name: 'Week 3 — Beyond the request', days: [15, 16, 17] },
];

export default function Home() {
  const { completed, unlockedDay } = useProgress();
  const firstIncomplete = lessons.find((l) => !completed[l.id]);
  const doneCount = lessons.filter((l) => completed[l.id]).length;

  return (
    <>
      <div className="hero">
        <div className="eyebrow">A private bootcamp for one React developer</div>
        <h1>
          Learn Express by <em>shipping routes</em>.
        </h1>
        <p className="lede">
          Seventeen days, one lesson a day: read the concepts, study a worked example, then write real Express code in
          the editor — in JavaScript, TypeScript, or both. Your code runs on a local Node process and real HTTP
          requests decide whether you pass. Days unlock in order — no skipping ahead.
        </p>
        {firstIncomplete ? (
          <Link className="btn-cta" to={`/day/${firstIncomplete.day}`}>
            {doneCount === 0 ? 'Start Day 1 →' : `Continue with Day ${firstIncomplete.day} →`}
          </Link>
        ) : (
          <Link className="btn-cta" to="/day/17">
            All 17 days complete — you did it 🎓
          </Link>
        )}
      </div>

      <div className="curriculum">
        {arcs.map((arc) => (
          <React.Fragment key={arc.name}>
            <h2>{arc.name}</h2>
            {arc.days.map((dayNum) => {
              const lesson = lessons[dayNum - 1];
              const done = !!completed[lesson.id];
              const locked = dayNum > unlockedDay;
              if (locked) {
                return (
                  <div
                    key={lesson.id}
                    className="day-card locked"
                    title={`Pass Day ${String(dayNum - 1).padStart(2, '0')}'s exercise to unlock`}
                    aria-disabled="true"
                  >
                    <span className="num">{String(dayNum).padStart(2, '0')}</span>
                    <span className="titles">
                      <span className="t">{lesson.title}</span>
                      <br />
                      <span className="s">{lesson.summary}</span>
                    </span>
                    <span className="status lockedcode">403 LOCKED</span>
                  </div>
                );
              }
              return (
                <Link key={lesson.id} to={`/day/${dayNum}`} className="day-card">
                  <span className="num">{String(dayNum).padStart(2, '0')}</span>
                  <span className="titles">
                    <span className="t">{lesson.title}</span>
                    <br />
                    <span className="s">{lesson.summary}</span>
                  </span>
                  <span className={`status ${done ? 'done' : 'todo'}`}>{done ? '200 OK' : 'PENDING'}</span>
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

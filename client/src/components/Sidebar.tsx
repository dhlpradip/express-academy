import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { lessons } from '../lessons/index.ts';
import { useProgress } from '../progress.tsx';

const arcs = [
  { name: 'Foundations', days: [1, 2, 3, 4] },
  { name: 'Building APIs', days: [5, 6, 7, 8, 9] },
  { name: 'Production', days: [10, 11, 12, 13, 14] },
  { name: 'Beyond the Request', days: [15, 16, 17, 18] },
];

export default function Sidebar() {
  const { completed, unlockedDay } = useProgress();
  const doneCount = lessons.filter((l) => completed[l.id]).length;

  return (
    <nav className="sidebar" aria-label="Course days">
      <div className="sidebar-brand">
        <Link to="/" className="wordmark">
          Express <em>Academy</em>
        </Link>
        <div className="listening">
          <span className="dot" aria-hidden="true" />
          18-day backend bootcamp
        </div>
      </div>

      <div className="route-table">
        {arcs.map((arc) => (
          <React.Fragment key={arc.name}>
            <div className="arc-label">{arc.name}</div>
            {arc.days.map((dayNum) => {
              const lesson = lessons[dayNum - 1];
              const done = !!completed[lesson.id];
              const locked = dayNum > unlockedDay;
              if (locked) {
                return (
                  <div
                    key={lesson.id}
                    className="route-row locked"
                    title={`Pass Day ${String(dayNum - 1).padStart(2, '0')}'s exercise to unlock`}
                    aria-disabled="true"
                  >
                    <span className="route-num">{String(dayNum).padStart(2, '0')}</span>
                    <span className="route-title">{lesson.title}</span>
                    <span className="route-status lockedcode">403</span>
                  </div>
                );
              }
              return (
                <NavLink
                  key={lesson.id}
                  to={`/day/${dayNum}`}
                  className={({ isActive }) => `route-row${isActive ? ' active' : ''}`}
                >
                  <span className="route-num">{String(dayNum).padStart(2, '0')}</span>
                  <span className="route-title">{lesson.title}</span>
                  <span className={`route-status ${done ? 'done' : 'todo'}`}>{done ? '200' : '···'}</span>
                </NavLink>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="sidebar-progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(doneCount / lessons.length) * 100}%` }} />
        </div>
        <div className="progress-caption">
          {doneCount}/{lessons.length} days complete
        </div>
      </div>
    </nav>
  );
}

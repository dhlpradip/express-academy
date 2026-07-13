import type { RunOutcome } from '../api.ts';
import type { ExerciseTest } from '@academy/shared/exercises';

interface TestLogProps {
  outcome: RunOutcome | null;
  tests: ExerciseTest[];
}

export default function TestLog({ outcome, tests }: TestLogProps) {
  if (!outcome) return null;
  const { fatal, results = [], logs } = outcome;
  const passed = results.filter((r) => r.pass).length;

  return (
    <div className="testlog" role="log" aria-label="Test results">
      <div className="testlog-head">
        <span>test run</span>
        {!fatal && (
          <span>
            {passed}/{results.length} passing
          </span>
        )}
      </div>

      {fatal && <div className="fatal">{fatal}</div>}

      {!fatal &&
        results.map((r, i) => {
          const spec = tests[i];
          const method = spec?.request.method ?? 'GET';
          return (
            <div key={i} className={`testlog-row ${r.pass ? 'pass' : 'fail'}`} style={{ animationDelay: `${i * 40}ms` }}>
              <span className="testlog-mark">{r.pass ? '✓' : '✗'}</span>
              <div className="testlog-main">
                {spec && <span className={`method method-${method}`}>{method}</span>}
                <span className="testlog-name">{r.name}</span>
                {!r.pass && r.detail && <div className="testlog-detail">{r.detail}</div>}
              </div>
            </div>
          );
        })}

      {logs && <div className="console-out">{logs}</div>}
    </div>
  );
}

import type { RunOutcome } from '../api.ts';
import type { ExerciseTest } from '@academy/shared/exercises';

interface TestLogProps {
  outcome: RunOutcome | null;
  tests: ExerciseTest[];
}

export default function TestLog({ outcome, tests }: TestLogProps) {
  if (!outcome) return null;
  const { fatal, typeErrors, results = [], logs } = outcome;
  const passed = results.filter((r) => r.pass).length;

  if (typeErrors && typeErrors.length > 0) {
    return (
      <div className="testlog" role="log" aria-label="Type errors">
        <div className="testlog-head">
          <span>tsc --strict</span>
          <span>
            {typeErrors.length} error{typeErrors.length === 1 ? '' : 's'}
          </span>
        </div>
        {typeErrors.map((e, i) => (
          <div key={i} className="testlog-row fail" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="testlog-mark">✗</span>
            <div className="testlog-main">
              <span className="typeerr-loc">
                L{e.line}:{e.column} · TS{e.code}
              </span>
              <span className="testlog-name">{e.message}</span>
            </div>
          </div>
        ))}
        <div className="testlog-footer">Behavior tests run once the types are clean — same gate order as CI.</div>
      </div>
    );
  }

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

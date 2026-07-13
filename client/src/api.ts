import type { Language } from './progress.tsx';

export interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

export interface RunOutcome {
  fatal?: string;
  results?: TestResult[];
  logs?: string;
}

export async function runExercise(exerciseId: string, code: string, language: Language): Promise<RunOutcome> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, code, language }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string }).error ?? '';
    } catch {
      /* not json */
    }
    throw new Error(detail || `grader responded ${res.status}`);
  }
  return (await res.json()) as RunOutcome;
}

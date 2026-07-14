import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import type { Exercise } from '@academy/shared/exercises';
import { checkTypes, type TypeCheckError } from './typechecker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_ROOT = path.join(__dirname, '..', '.tmp');
const CHILD = path.join(__dirname, 'child-runner.cjs');

const MARKER = '@@RESULTS@@';
const TIMEOUT_MS = 12_000;

export type Language = 'js' | 'ts';

export interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

export interface RunOutcome {
  fatal?: string;
  typeErrors?: TypeCheckError[];
  results?: TestResult[];
  logs: string;
}

/**
 * Run a student's code against an exercise's test spec. TypeScript submissions
 * are first type-checked with strict tsc — errors block the behavior tests,
 * the same gate order as CI — then transpiled (ESM -> CJS) with esbuild.
 */
export async function runAttempt(exercise: Exercise, code: string, language: Language = 'js'): Promise<RunOutcome> {
  let jsCode = code;
  if (language === 'ts') {
    const typeErrors = checkTypes(code);
    if (typeErrors.length > 0) {
      return { typeErrors, logs: '' };
    }
    try {
      const result = await transform(code, { loader: 'ts', format: 'cjs', target: 'node18' });
      jsCode = result.code;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { fatal: 'TypeScript could not be parsed:\n' + message.slice(0, 600), logs: '' };
    }
  }

  const dir = path.join(TMP_ROOT, randomBytes(6).toString('hex'));
  await mkdir(dir, { recursive: true });
  const userFile = path.join(dir, 'attempt.cjs');
  const testsFile = path.join(dir, 'tests.json');
  await writeFile(userFile, jsCode, 'utf8');
  await writeFile(testsFile, JSON.stringify({ tests: exercise.tests, env: exercise.env ?? {} }), 'utf8');

  try {
    const { stdout, stderr, timedOut } = await execChild(['--no-warnings', CHILD, userFile, testsFile]);
    const logs = extractLogs(stdout);
    const markerLine = stdout.split('\n').find((l) => l.includes(MARKER));

    if (!markerLine) {
      if (timedOut) {
        return { fatal: 'Your code timed out. Check for infinite loops or handlers that never respond.', logs };
      }
      const errTail = stderr.trim().split('\n').slice(-6).join('\n');
      return { fatal: 'The test runner crashed unexpectedly.' + (errTail ? '\n' + errTail : ''), logs };
    }

    const payload = JSON.parse(markerLine.slice(markerLine.indexOf(MARKER) + MARKER.length)) as Omit<RunOutcome, 'logs'>;
    return { ...payload, logs };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function extractLogs(stdout: string): string {
  return stdout
    .split('\n')
    .filter((l) => !l.includes(MARKER) && l.trim() !== '')
    .join('\n')
    .slice(0, 4000);
}

interface ChildResult {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

function execChild(args: string[]): Promise<ChildResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut });
    });
  });
}

/**
 * Quality gate: every exercise's JS AND TS reference solutions must pass all
 * of their own tests, and every starter (both languages) must load cleanly.
 * Run from the repo root: npm run check
 */
import { exercises } from '@academy/shared/exercises';
import { runAttempt, type Language } from '../src/runner.js';
import { checkTypes } from '../src/typechecker.js';

let failed = false;

for (const [id, exercise] of Object.entries(exercises)) {
  for (const language of ['js', 'ts'] as Language[]) {
    const solution = language === 'ts' ? exercise.solutionTs : exercise.solution;
    const starter = language === 'ts' ? exercise.starterTs : exercise.starter;

    if (language === 'ts') {
      for (const [label, code] of [['solution', solution], ['starter', starter]] as const) {
        const errs = checkTypes(code);
        if (errs.length > 0) {
          failed = true;
          console.log(`✗ ${id} [ts]: ${label} has ${errs.length} type error(s):`);
          for (const e of errs) console.log(`    L${e.line}:${e.column} TS${e.code}: ${e.message.split('\n')[0]}`);
        }
      }
    }

    const outcome = await runAttempt(exercise, solution, language);
    if (outcome.fatal) {
      failed = true;
      console.log(`✗ ${id} [${language}]: solution crashed — ${outcome.fatal}`);
    } else {
      const bad = (outcome.results ?? []).filter((r) => !r.pass);
      if (bad.length > 0) {
        failed = true;
        console.log(`✗ ${id} [${language}]: ${bad.length}/${outcome.results!.length} tests failed`);
        for (const r of bad) console.log(`    ✗ ${r.name}\n      ${r.detail.replace(/\n/g, '\n      ')}`);
      } else {
        console.log(`✓ ${id} [${language}]: solution passes all ${outcome.results!.length} tests`);
      }
    }

    const starterOutcome = await runAttempt(exercise, starter, language);
    if (starterOutcome.fatal) {
      failed = true;
      console.log(`✗ ${id} [${language}]: STARTER crashes on load — ${starterOutcome.fatal}`);
    }
  }
}

process.exit(failed ? 1 : 0);

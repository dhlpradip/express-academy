# /debug — Diagnose and fix a bug

Systematically find the root cause before changing code.

Steps:
1. Restate the expected vs actual behavior and how to reproduce it.
2. Form 2–3 hypotheses ranked by likelihood.
3. Gather evidence: read the relevant code paths, add targeted logging, or write
   a failing test that reproduces the bug. Confirm the actual root cause — do
   not guess-patch symptoms.
4. Implement the minimal fix at the root cause.
5. Add a regression test that fails before and passes after the fix.
6. Verify the original repro is resolved and nothing else broke.
7. Explain the root cause in 2–3 sentences.

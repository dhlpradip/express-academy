# /review — Review my changes

Review the current diff (or the files I mention) as a senior engineer.

Steps:
1. Summarize what the change does in 1–2 sentences.
2. Flag issues by severity: **blocking**, **should-fix**, **nit**. For each,
   give the file:line, the problem, and a concrete fix.
3. Check specifically for: correctness/edge cases, security (input validation,
   secrets, injection, authz), error handling, types, tests, and accessibility
   (for UI).
4. Note anything that violates `AGENTS.md` for this repo.
5. End with a short verdict: safe to merge, or what must change first.

Do not rewrite the whole file. Point to precise, minimal fixes.

# /pr — Prepare a pull request

Prepare this branch for review.

Steps:
1. Run `git status` and `git diff` against the base branch to see all changes.
2. Ensure typecheck/lint/tests pass; fix what's broken.
3. Draft a PR with:
   - **Title**: `type(scope): summary` (imperative, concise).
   - **Summary**: 1–3 bullets on *what* and *why*.
   - **Test plan**: how it was verified / checklist to verify.
   - **Risk / rollout**: anything reviewers should watch.
4. Do NOT push or open the PR unless I explicitly ask. Show me the draft first.

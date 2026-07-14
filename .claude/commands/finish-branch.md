# /finish-branch — Wrap up a development branch

Get this branch to a clean, done state and let me choose how to land it.

Steps:
1. Run `git status` and `git diff` to review everything that changed.
2. Run the project's typecheck / lint / tests. Fix anything broken; do not
   proceed with failing checks.
3. Verify the work actually meets the spec/acceptance criteria — not just that
   it compiles. Remove leftover debug code, TODOs, and dead code.
4. Summarize what changed and what was verified.
5. Present options and wait for me to pick — do NOT push or merge on your own:
   - open a PR (draft the title/description), or
   - merge locally, or
   - keep the branch as-is, or
   - discard it.
6. After I choose, do only that, then clean up (e.g. remove a worktree).

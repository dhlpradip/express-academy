# /refactor — Refactor safely

Refactor the target code without changing its observable behavior.

Steps:
1. State the current behavior and the smell you're addressing.
2. Ensure there are tests that pin the current behavior; add them first if not.
3. Make the smallest sequence of behavior-preserving changes. Improve names,
   remove duplication, tighten types, split large units.
4. Keep the diff reviewable — no drive-by reformatting of untouched code.
5. Run typecheck/lint/tests after each meaningful step; confirm all green.
6. Summarize what changed and what intentionally did not.

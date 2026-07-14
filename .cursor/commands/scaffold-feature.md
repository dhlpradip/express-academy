# /scaffold-feature — Plan and scaffold a feature

Turn a feature request into a plan, then implement it incrementally.

Steps:
1. Clarify the goal, inputs/outputs, and acceptance criteria. Ask only if truly
   blocked; otherwise state your assumptions.
2. Produce a short plan: files to add/change, data flow, and the layers touched
   (UI → API → service → data). Follow this repo's `AGENTS.md` conventions.
3. Implement in small, verifiable steps. After each, run typecheck/lint/tests.
4. Wire the happy path first, then edge/error cases, then polish (a11y, empty
   states, loading).
5. Add tests for the new behavior and update docs/README if setup changed.
6. Summarize what you built and how to run/verify it.

# /test — Write tests for this code

Write focused tests for the code I specify (default: my latest change).

Steps:
1. Identify the public behavior and contracts worth testing. Test behavior, not
   implementation details.
2. Cover: the happy path, edge cases, error/failure paths, and any bug this
   change fixes (add a regression test).
3. Use the project's existing test framework and conventions — match nearby test
   files. Keep tests deterministic (no real network/time/randomness).
4. Run the tests and iterate until they pass.
5. Report coverage gaps you deliberately left and why.

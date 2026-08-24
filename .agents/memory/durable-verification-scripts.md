---
name: Durable verification scripts
description: Constraint in this workspace's durable CodeExecution environment.
---

## Rule

Use fixed, explicitly cleaned identifiers for temporary database records in
durable CodeExecution tests.

**Why:** The sandbox blocks `crypto`, `Math.random()`, and `Date.now()` despite
their availability in ordinary application code.

**How to apply:** Before a disposable test, delete records with its fixed label;
wrap setup and assertions in `try`/`finally` cleanup so a failed test does not
leave project data behind.
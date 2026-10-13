---
name: Student project visibility
description: Student dashboards must keep each group's working projects separate.
---

Students should see only projects they are working on, not projects belonging to other teams, on their dashboard.

**Why:** The user explicitly requested this restriction. The Studio uses shared job-group logins, so switching groups on the same browser must not carry over the previous group's projects.

**How to apply:** Keep owned project lists scoped to the current student or job group in both server responses and client caches. Cancel outstanding requests and clear private cached data when changing logins. Keep specifically assigned peer-review work in the dedicated review inbox; do not turn owned project lists into a school-wide project feed.

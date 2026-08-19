---
name: Integration & API Testing
description: Focused testing of business rules, repositories, and API workflows.
---

## Priorities

Prioritize tests for business-critical behavior rather than maximizing coverage.

At minimum test:

- proposal creation,
- proposal retrieval,
- invalid proposal ID,
- invalid request body,
- valid status transitions,
- invalid status transitions,
- send operation,
- sent email persistence.

## Workflow

Test the complete state transition:

draft
→ sent
→ approved
→ paid

Verify invalid transitions are rejected.

## Database

Use an isolated test SQLite database.

Tests must not modify the development database.

## Philosophy

Prefer a small number of meaningful integration tests over large numbers of shallow unit tests.

Do not write tests purely to increase coverage percentages.

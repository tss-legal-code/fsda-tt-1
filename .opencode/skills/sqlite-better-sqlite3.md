---
name: SQLite & better-sqlite3
description: SQLite persistence, repositories, transactions, initialization, and deterministic development seeding.
---

## Database

- Use a single SQLite database file for local development.
- Keep database access in `@/lib/db`.
- Do not access SQLite directly from React components or Route Handlers.
- Encapsulate SQL inside repository modules.

## Connection

- Create a reusable server-only database connection.
- Do not create a new SQLite connection for every query.
- Keep the database module isolated from client-side code.

## Repositories

Repositories are responsible for persistence only.

They should:

- execute SQL,
- map rows into typed database/domain objects,
- handle database-specific concerns.

They should not:

- decide proposal workflow rules,
- format API responses,
- contain UI logic.

## Transactions

Use `db.transaction()` when an operation modifies multiple related records and must succeed or fail atomically.

Examples:

- creating a proposal together with its items,
- sending a proposal and recording the sent email.

## Foreign keys

Enable SQLite foreign key enforcement.

Use foreign keys between:

- reservations → members
- proposals → reservations
- proposal_items → proposals
- sent_emails → proposals

## Seeding

Provide deterministic development seed data for:

Member:
James Whitfield

Reservation:
Villa Punta Mita, Mexico
Arrival: March 15
Departure: March 22

Seeding must be idempotent or safely resettable.

Do not silently overwrite user-created data during normal application startup.

## Money

Store monetary values as integer minor units (for example cents) rather than floating-point numbers.

Convert to formatted currency only at the presentation boundary.

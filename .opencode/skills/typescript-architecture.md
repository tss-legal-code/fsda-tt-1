---
name: TypeScript Architecture
description: Strict TypeScript, domain modeling, type boundaries, and maintainable application architecture.
---

## Strict typing

- Avoid `any`.
- Do not use `as any`.
- Avoid unnecessary type assertions.
- Prefer explicit types, discriminated unions, and type guards.

## Layer boundaries

Keep separate concepts for:

- database row types,
- domain types,
- API request types,
- API response types,
- UI/view-model types.

Do not automatically reuse a database row type as an API response type.

## Domain types

Represent finite business states using unions or enums.

Example:

type ProposalStatus =
| 'draft'
| 'sent'
| 'approved'
| 'paid';

## Business logic

Keep domain rules in pure functions where practical.

Example:

canTransitionProposalStatus(
currentStatus,
nextStatus
)

Pure business logic should be easy to test without SQLite or React.

## Nullability

Handle nullable database values explicitly.

Do not hide nullability using non-null assertions (`!`) unless the invariant is genuinely guaranteed.

## Naming

Use domain terminology consistently:

- Proposal
- ProposalItem
- Reservation
- Member
- SentEmail
- ProposalStatus

Avoid generic names such as:

- Data
- ItemData
- Record
- Entity
- Info

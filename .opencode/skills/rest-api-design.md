---
name: REST API Design & Errors
description: Consistent Next.js Route Handlers, validation, HTTP semantics, and domain error handling.
---

## Response format

Use a consistent JSON response structure:

Success:
{
"success": true,
"data": ...
}

Error:
{
"success": false,
"error": "Human-readable message"
}

Do not expose stack traces, SQL errors, or internal implementation details.

## HTTP status codes

Use:

- 200 for successful reads and updates
- 201 for successful resource creation
- 400 for malformed or invalid input
- 404 when a requested resource does not exist
- 409 for invalid state transitions or conflicting operations
- 500 only for unexpected server errors

## Validation

- Validate every request body using Zod.
- Validate URL parameters before using them.
- Never trust client-provided IDs, statuses, prices, or timestamps.
- Do not duplicate validation logic between Route Handlers and repositories.

## Resource semantics

Use predictable REST-style routes:

GET /api/reservations
GET /api/proposals
POST /api/proposals
GET /api/proposals/:id
PATCH /api/proposals/:id
POST /api/proposals/:id/send

## Business rules

HTTP handlers must not blindly accept status changes.

Proposal status transitions must follow:

draft → sent → approved → paid

Reject invalid transitions with HTTP 409.

Examples:

- draft → approved: reject
- draft → paid: reject
- sent → paid: reject
- paid → anything: reject

## Error handling

- Catch expected domain errors and map them to appropriate HTTP responses.
- Unexpected errors should produce a generic 500 response.
- Log unexpected server errors.

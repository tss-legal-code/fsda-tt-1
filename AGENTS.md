# Concierge Itinerary Proposal System

## Project Overview

Build a lightweight **Concierge Itinerary Proposal System** for a luxury travel company.

The application models a concierge preparing a curated itinerary for a member, sending the proposal to the member, and allowing the member to review, approve, and pay to lock in the itinerary.

This is an assessment project. Code quality, product thinking, UX quality, data modeling, API design, and completeness of the workflow are more important than implementing unnecessary features.

---

## Product Scenario

The application is initially focused on one simulated member and reservation.

### Member

- Name: James Whitfield
- Email: use a seeded/test email address

### Reservation

- Destination: Mexico
- Villa: Villa Punta Mita
- Arrival: March 15
- Departure: March 22

The member and reservation must be seeded into SQLite.

The application should be designed so that supporting additional members and reservations later would be straightforward, but **do not over-engineer the current implementation for multi-tenant or multi-member support**.

---

## User Roles / Experiences

There are two distinct experiences.

### Concierge

The concierge uses the application to:

1. View the member's upcoming reservation.
2. Create a proposal.
3. Add itinerary items.
4. Edit/remove draft items.
5. Preview the proposal.
6. Send the proposal.
7. View existing proposals and their statuses.

The concierge UI should prioritize:

- efficiency,
- clarity,
- fast editing,
- clear status,
- obvious actions,
- useful feedback.

It is an operational interface, not a marketing page.

### Member

The member accesses:

`/proposal/[id]`

This simulates the link received in the proposal email.

The member can:

1. Review the itinerary.
2. Review scheduled experiences.
3. Review pricing.
4. Approve the proposal.
5. Pay & Lock In the approved proposal.

The member UI should feel like a **premium private travel proposal**, not an internal dashboard or generic SaaS application.

---

## Core Workflow

The central workflow is:

```text
Create draft
    ↓
Add itinerary items
    ↓
Preview
    ↓
Send proposal
    ↓
Member reviews
    ↓
Approve
    ↓
Pay & Lock In
    ↓
Paid / Locked In
```

Proposal states are:

```text
draft → sent → approved → paid
```

Only these transitions are valid:

```text
draft → sent
sent → approved
approved → paid
```

Invalid transitions must be rejected by the server.

The client must not be trusted to enforce workflow rules.

A `paid` proposal is considered locked in and should not be editable through the normal UI.

---

## Itinerary Categories

The proposal builder must use these predefined categories:

### Dining

- Private Chef Dinner
- Restaurant Reservation

### Activities

- Surf Lesson
- Snorkeling
- ATV Tour

### Wellness

- Spa Treatment
- Yoga Session
- Massage

### Excursions

- Whale Watching
- Sailing Charter
- Cultural Tour

### Transport

- Airport Transfer
- Private Car
- Helicopter

### Experiences

- Sunset Cocktails
- Bonfire on the Beach
- Tequila Tasting

Categories should be represented as a typed domain concept rather than arbitrary strings scattered throughout the UI.

---

## Required Technology

Use:

- Next.js 14+
- App Router
- TypeScript
- Tailwind CSS
- SQLite
- `better-sqlite3`
- Zod for request/input validation

Do not introduce additional frameworks or libraries unless they solve a concrete problem.

Do not add a component library unless there is a strong reason.

Prefer simple, readable implementations over unnecessary abstraction.

---

## Architecture

Use a clear separation between:

```text
UI
 ↓
Route Handler / Server Component
 ↓
Service / Domain Logic
 ↓
Repository
 ↓
SQLite
```

### UI

React/Next.js components should handle presentation and user interaction.

They should not contain SQL or database access.

### Route Handlers

Route Handlers are responsible for:

- parsing requests,
- validating input,
- calling application/domain logic,
- mapping results to HTTP responses.

Do not put large amounts of business logic or SQL inside `route.ts`.

### Services / Domain Logic

Business rules belong here.

Examples:

- proposal status transitions,
- sending a proposal,
- approval,
- payment,
- calculating totals.

Keep important domain rules testable independently from React.

### Repositories

Repositories are responsible for persistence.

They should contain:

- SQL queries,
- database row mapping,
- persistence-specific logic.

They should not contain UI or HTTP concerns.

---

## Database

Required tables:

```text
members
reservations
proposals
proposal_items
sent_emails
```

Relationships:

```text
members
  └── reservations
        └── proposals
              ├── proposal_items
              └── sent_emails
```

Use foreign keys and enable SQLite foreign-key enforcement.

Proposal totals should be derived from proposal items rather than trusted from the client.

Prices should be stored as integer minor units rather than floating-point monetary values.

For example:

```text
$1,250.50 → 125050
```

Formatting into currency is a presentation concern.

---

## Seed Data

The development database must contain:

```text
James Whitfield
Villa Punta Mita
Mexico
March 15 → March 22
```

Seeding must be deterministic and safe to run repeatedly.

Do not overwrite existing user-created data on every application startup.

Provide a simple development database initialization/seed mechanism.

---

## API

Implement:

```text
GET    /api/reservations
POST   /api/proposals
GET    /api/proposals
GET    /api/proposals/[id]
PATCH  /api/proposals/[id]
POST   /api/proposals/[id]/send
```

Use consistent JSON responses and appropriate HTTP status codes.

Use:

```text
200 OK
201 Created
400 Bad Request
404 Not Found
409 Conflict
500 Internal Server Error
```

Use `409 Conflict` for invalid proposal state transitions.

All client-provided request bodies must be validated with Zod.

Never trust:

- proposal status,
- proposal totals,
- prices,
- IDs,
- timestamps

provided by the client.

The server is authoritative.

---

## Sending a Proposal

There is no real email provider.

When a proposal is sent:

1. Verify the proposal exists.
2. Verify its status is `draft`.
3. Update it to `sent`.
4. Set `sent_at`.
5. Create a `sent_emails` record.
6. Generate/log the member proposal URL.
7. Make the sent state visible in the concierge UI.

The status update and email record should be atomic.

No real email should be sent.

---

## Payment

There is no real payment processing.

`Pay & Lock In` simply performs the domain transition:

```text
approved → paid
```

After successful payment, display a confirmation screen communicating that the itinerary has been locked in.

Do not integrate Stripe or another payment provider.

---

## UI Requirements

### Concierge

The dashboard should prominently show:

- member name,
- destination,
- villa,
- arrival,
- departure.

The proposal builder should make it fast to:

- choose a category,
- choose an itinerary item,
- set date/time,
- edit description,
- set estimated price,
- remove an item.

The concierge should be able to preview the complete proposal before sending.

Existing proposals should be visible with their current status.

Use clear status indicators for:

```text
Draft
Sent
Approved
Paid
```

---

## Member Experience

The member view should present the itinerary in a **day-by-day timeline** where practical.

Example:

```text
March 15
Arrival
Airport Transfer
Private Chef Dinner

March 16
Yoga Session
Snorkeling
Sunset Cocktails

...
```

The exact itinerary depends on the items created by the concierge.

The total estimated cost must be clearly displayed.

The primary actions should be:

```text
Approve Itinerary
Pay & Lock In
```

Do not make the member experience look like an administration interface.

---

## Luxury Design Direction

The member-facing experience should communicate:

- exclusivity,
- calm,
- sophistication,
- personalization,
- premium hospitality.

Prefer:

- generous whitespace,
- warm neutrals,
- ivory/off-white surfaces,
- charcoal typography,
- restrained champagne/bronze accents,
- elegant typography hierarchy,
- subtle borders,
- editorial composition,
- carefully selected imagery,
- subtle transitions.

Avoid:

- generic SaaS aesthetics,
- neon colors,
- excessive gradients,
- excessive glassmorphism,
- excessive shadows,
- excessive rounded cards,
- excessive pills/badges,
- overly decorative icons,
- visually noisy layouts.

Do not equate "luxury" with gold gradients or excessive decoration.

The concierge interface should remain practical and efficient even though it belongs to the same product.

---

## Responsive Design & Accessibility

The application must work on desktop and mobile.

Use semantic HTML and keyboard-accessible controls.

Interactive controls should have appropriate:

- hover states,
- focus-visible states,
- disabled states,
- loading states,
- error states.

Do not rely on color alone to communicate status.

---

## Error & Empty States

Do not leave users with silent failures.

Provide meaningful UI states for:

- failed API requests,
- missing proposal,
- empty draft,
- failed send,
- failed approval,
- failed payment,
- loading states.

Messages should explain what happened and, where appropriate, what the user can do next.

---

## Testing

Prioritize meaningful tests over maximum coverage.

At minimum test:

- proposal creation,
- proposal retrieval,
- invalid input,
- missing proposal,
- valid status transitions,
- invalid status transitions,
- proposal sending,
- sent email persistence.

The complete lifecycle should be testable:

```text
draft → sent → approved → paid
```

Tests must use an isolated test database.

---

## Code Quality Rules

Prefer:

- small focused components,
- explicit types,
- pure domain functions,
- readable names,
- simple abstractions,
- cohesive modules.

Avoid:

- `any`,
- unnecessary type assertions,
- giant React components,
- giant Route Handlers,
- duplicated business rules,
- duplicated SQL,
- premature abstractions,
- generic utility functions with unclear ownership,
- unnecessary state management libraries.

Do not optimize for theoretical scalability at the expense of clarity.

This is a small assessment application.

---

## Important Development Principle

Before implementing a feature, understand which layer owns the responsibility.

For example:

```text
"Can this proposal be approved?"
        ↓
Domain/service layer

"How do I persist this proposal?"
        ↓
Repository

"How do I return HTTP 409?"
        ↓
Route Handler

"How should the button look?"
        ↓
UI component
```

Do not solve domain problems inside presentation components.

---

## Definition of Done

The project is considered complete when the following end-to-end scenario works:

1. Start the application.
2. Open the concierge dashboard.
3. See James Whitfield's reservation.
4. Create a draft proposal.
5. Add multiple itinerary items across categories.
6. Set dates, times, descriptions, and prices.
7. Preview the proposal.
8. Send the proposal.
9. See the proposal become `sent`.
10. See the simulated proposal URL/log.
11. Open `/proposal/[id]`.
12. Review the premium member experience.
13. Approve the proposal.
14. See it become `approved`.
15. Pay & Lock In.
16. See it become `paid`.
17. See the confirmation screen.
18. Return to the concierge view and see the final `paid` status.

The complete loop must work without manually editing the database.

---

## Scope Discipline

Do not implement stretch goals until the core workflow is complete.

Do not add:

- real authentication,
- real email providers,
- real payment processing,
- external travel APIs,
- complex role management,
- unnecessary microservices,
- unnecessary state management,
- unnecessary infrastructure.

If there is extra time, prioritize:

1. polished member timeline,
2. draft editing,
3. notes/message to member,
4. subtle confirmation animations,
5. responsive/mobile polish,
6. additional tests.

---

## Documentation

README.md must explain:

- how to install,
- how to run,
- how to initialize/seed SQLite,
- architecture,
- assumptions,
- important design decisions,
- what would be improved with more time,
- interesting/challenging parts,
- known limitations.

Keep the README concise and honest.

---

## Existing Project Skills

Use the project's `.opencode/skills/` instructions as detailed guidance.

Relevant skills include:

- `nextjs-app-router.md`
- `typescript-architecture.md`
- `rest-api-design.md`
- `sqlite-better-sqlite3.md`
- `proposal-domain.md`
- `product-ux-a11y.md`
- `luxury-hospitality-ui.md`
- `testing.md`

When instructions overlap, prioritize:

1. explicit project requirements in this file,
2. domain/workflow rules,
3. architecture rules,
4. UI/design rules,
5. general coding preferences.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Concierge Itinerary Proposal System

A lightweight proposal system for luxury travel concierges to create, manage, and deliver curated itinerary proposals to members.

# Test-task reqired project information

## How to install and run locally​

```bash
npm run init
```

This runs `npm install && next dev` in one step.

## Any assumptions i made​

1. Single simulated scenario. The system is seeded with one member (James Whitfield) and one reservation (Villa Punta Mita, March 15–22), as the system is about proposals for the future reservations, so initial reservation takes place in 2027. This matches the assessment scope. The architecture supports multiple members and reservations — and the UI does implement full CRUD for both — but the seed data reflects the specific scenario described.

2. No real email or payment. Sending a proposal updates the status to "sent," creates a sent_emails record, and logs the member proposal URL to the console (browser) and terminal (server). Paying simply transitions the status to "paid." This matches the requirement for simulated actions.

3. SQLite is sufficient. The application is a single-concierge tool, not a multi-tenant SaaS. SQLite via better-sqlite3 provides ACID transactions, foreign key enforcement, and synchronous simplicity. An ORM would add abstraction without benefit at this scale.

4. Server Components by default. Only components requiring interactivity (forms, buttons, state) are Client Components. The member-facing proposal page is almost entirely a Server Component — only the action buttons and confirmation view are client-side. This is a deliberate architectural choice for performance and simplicity.

5. Currency is hardcoded as `USD`. Prices in integer cents. All monetary values are stored as integers to avoid floating-point errors. $1,250.50 is stored as 125050. Currency formatting is a presentation concern handled by Intl.NumberFormat. This is a standard practice for financial data.

6. Timezone handling. Times are stored as UTC ISO 8601 strings. Input and display use the browser's local timezone via buildLocalDate() and toLocalDateTime() utilities. This avoids complex timezone conversion logic while keeping the data consistent. So basically the time zone of destination is not taken into account (but in production it should be), no hints or notes on the proposal page.

7. Status transitions enforced server-side. The client never enforces workflow rules. Invalid transitions throw InvalidProposalTransitionError, which the API maps to HTTP 409 Conflict. The UI simply reflects the current state and disables invalid actions.

8. For concierge interface and proposal only English is implemented. In production, preffered language of the member should be used whenever possible for proposals.

9. I used ZOD for schema validations, was not required but i believe this is a must.

10. I added tests for BFF endpoints to ensure consistency and stablility of the whole system. This ensures new features will caluse less **unexpected** bugs.

11. The preview modal doesn't render the exact member page layout — it's a simplified approximation. To avoid jumping to console for proposal URL --- i added a button in concierge UI toopen the proposal page.

12. Notes for the proposal (extra feature) are limited to 2000 characters (validated server-side).

13. The seed script only creates one member and one reservation — adding more requires the concierge UI or manual DB inserts or use BFF endpoints.

14. The SSE connection (i used actually as a workaround for SQLite) doesn't recover automatically if the server restarts.

15. A member cannot be deleted if active reservations exist

16. Proposals table has CHECK constraint restricting status to only 'draft', 'sent', 'approved', or 'paid'.

## What I would improve given more time​

1. Real email delivery. Add UI to edit proposal emails even more with a styled HTML template. The sent_emails table already captures the audit trail — the missing piece is the actual SMTP/API call.

2. Authentication and authorization. Add NextAuth.js or a session-based auth system. The concierge should authenticate before accessing the dashboard. The member link should include a signed token to prevent unauthorized access. Currenltly member can by accident access proposal of another member.

3. The system doesn't handle proposal expiry, which is not a proper way of doing business.

4. To add new line items it could be convenient to add drag and drop. But this speed may result in more accidents with errors in proposals (i believe rich members love precision).

5. There could be added a second person to approve the proposal before sending. I believe someone should prepare them and someone who probably knows the memeber should approve them.

6. Proposal is something static, so if it fails to satisfy the needs of the client - time spent on preparation, sending and reviewing is wasted. There could be added multiple proposals (to approve/pay for just one of them) in one proposal page.

7. The system doesn't handle proposal archiving when the reservation gets cancelled.

8. New proposal statuses could be added:

- `cancelled` (for any reason),
- `timed-out` (memeber reviewed too late),
- `needs-refinement` (partial approve from member)

9. Member can have a few proposals in `approved` state (when he is not certain), but we could add `rating` for such proposals to help concierge to understand the member better with less contacts with him (they are busy people)

10. Proposal versioning. Allow the concierge to create new versions of a sent proposal without losing the original. This would require a version column on proposals and a way to compare versions.

11. Add support for alternative line items (with same price for any of them).

12. Add support for parallel itinerary activities --- this is a raw idea as the use case i mean is parents with children: parents have one plan for the stay, children have fully/partially another plan.

13. Add live introduction with a video (no AI avatar generation - it feels cheap, quick personalized video) on the proposal page.

14. each itinerary activity (line item) can be made more eye-catching with:

- image/video/text overview/images scattered on the background of the page.
- add remarks/comments/feedback this item was highly valued
  - by the friends of the member
  - by other memebers
  - by other people known to the member
- choose service level - lux/king/emperor (or add such badges when concierge prepares proposal)
- price-returnable (e.g. everything is prepaid, but if this one is not used - money is returned)

15. on the proposal page

- add button to call concierge
- offer to install a mobile app
- add button to `recommend` to friends
- add button to share on social media
- mention legal assistance for taxation
  (to turn money spent on proposal into business expenses with preaparation of drafts for memorandums and protocols of intentions etc.)
- handle time zones
  member may be initially located in one time zone while his destination is in another time zone and in the concierge interface there should be set (figured out) the timezone of destination, and in the propsal that should be explicitly understandable

16. for concierge UI:

- add more member info:
  - important dates
    - birthdays,
    - anniversaries etc.
  - related people
  - personality remarks:
    - likes humor,
    - likes honorifics,
    - has health issues to avoid some activities
    - had diet problems etc.
- add presets of line items
  - per member
  - per location
- copy itinerary items from previous reservation to this place
- add constraints on pickable dates (now concierge can plan outside the dates of the reservtion)
- add notifications about member actions (approved/paid/wants to call)
  - in desktop version
  - in mobile app
  - in telegram etc.

17. `ITINERARY_ITEMS` are hardcoded, but actually they should be highly configurable per-member.

18. I see a limitation about DB structure about `villa` because member's destination can be not just `villa` but: `hotel`, `apartments`, `residence`, `palace` etc.

19. PDF export. Generate a beautifully formatted PDF itinerary for the member to download. This could use @react-pdf/renderer or a server-side HTML-to-PDF conversion.

20. Accessibility audit. Run automated accessibility testing (e.g., @axe-core/react) and manually test keyboard navigation, screen reader compatibility, and color contrast ratios.

21. Undo/redo in the proposal builder (command design pattern). Add a command history stack so the concierge can undo accidental item removals or edits.

22. Optimistic UI updates. Update the local state immediately on user actions (e.g., adding an item) before the server confirms. This makes the interface feel faster. Currently, the UI refetches from the server after each mutation (but in turn this is more reliable).

## What I found most interesting or challenging​

1. State machine enforcement at the domain layer. Defining valid transitions as a pure lookup table and having the service layer validate before persisting — while the API layer maps domain errors to HTTP codes — was a clean separation that made the system correct by construction. The exhaustive 4 by 4 transition matrix in the domain tests verifies every combination.

2. Server-only database boundary. Importing "server-only" in lib/db/index.ts makes it a compile-time error for any client component to access the database. This is a simple but powerful safety net that prevents accidental data access from the browser.

3. Atomic send operation. Wrapping the status update and email record creation in a SQLite transaction ensures that either both succeed or both fail. This is a small detail that prevents inconsistent state — a proposal marked as "sent" without a corresponding email record, or vice versa.

4. Balancing concierge efficiency with member luxury. The concierge interface prioritizes speed and clarity — inline editing, category dropdowns, date grouping. The member interface prioritizes elegance — serif typography, generous whitespace, day-by-day timeline. These are two different UX problems solved by the same data model, and the separation into components/dashboard/ and components/proposal/ keeps the concerns clean.

5. Real-time updates via SSE (for SQLite). The ProposalEventBus singleton (wrapping Node.js EventEmitter) + SSE endpoint + EventSource subscription pattern was a lightweight alternative to WebSockets or polling. It works well for this use case — the concierge sees proposal status changes in real time without a page refresh. But still this is just a workaround for the SQLite used.

# Other project information

## Normal Dev Start

```bash
npm install
npm run dev
```

The database is automatically created and seeded with test data on first startup.

The app runs at `http://localhost:3000`.

**Concierge dashboard:** `http://localhost:3000`

- Browse and manage members
- Browse and manage reservations per member
- Create, edit, and send itinerary proposals

**Member proposal view:** `http://localhost:3000/proposal/[id]` (create a proposal first)

## Commands

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run init`       | Install dependencies and start dev server        |
| `npm run dev`        | Start development server                         |
| `npm run build`      | Production build                                 |
| `npm run start`      | Serve production build                           |
| `npm run db:seed`    | Re-seed database (runs automatically on startup) |
| `npm run test`       | Run test suite                                   |
| `npm run test:watch` | Run tests in watch mode                          |
| `npm run typecheck`  | TypeScript type-check                            |
| `npm run lint`       | Run ESLint                                       |

## Database Reset

- `GET http://localhost:3000/api/admin/reset-db`

## Architecture

```
UI (React/Next.js)
    V
Route Handlers / Server Components
    V
Services (domain logic)
    V
Repositories (SQL, persistence)
    V
SQLite (better-sqlite3)
```

### Layers

- **UI** — Next.js App Router components. Server Components by default; Client Components only for interactivity (buttons, forms, state, SSE subscriptions).
- **Route Handlers** — Parse requests, validate input with Zod, call services, return HTTP responses.
- **Services** — Business rules: status transitions, sending, approval, payment, member/reservation CRUD. No SQL here.
- **Repositories** — SQL queries, row mapping, database access. No HTTP or UI concerns.
- **Domain** — Pure functions for status transitions (`canTransitionProposalStatus`) and calculations (`calculateProposalTotal`).
- **Events** — Server-Sent Events bus (`ProposalEventBus`) for real-time dashboard updates after write operations.

### Key Files

```
app/
  layout.tsx              — Root layout (fonts, metadata)
  page.tsx                — Concierge dashboard (Server Component)
  globals.css             — Tailwind v4 + CSS custom properties (design tokens)
  proposal/[id]/
    page.tsx              — Member proposal view (Server Component)
    not-found.tsx         — Styled 404
  api/
    admin/reset-db/       — GET reset database
    events/               — GET Server-Sent Events stream
    members/              — GET list, POST create
    members/[id]/         — GET, PATCH, DELETE member
    members/[id]/reservations/ — GET list, POST create reservation
    proposals/            — POST create, GET list
    proposals/[id]/       — GET detail, PATCH status (approve/pay)
    proposals/[id]/send/  — POST send proposal
    proposals/[id]/notes/ — PATCH update notes
    proposals/[id]/items/ — POST add item
    proposals/[id]/items/[itemId]/ — PATCH/DELETE item
    reservations/         — GET seeded reservation
    reservations/[id]/    — GET, PATCH, DELETE reservation

components/
  dashboard/              — 16 concierge UI components
  proposal/               — 9 member-facing UI components

lib/
  db/
    index.ts              — Database singleton (server-only boundary)
    schema.ts             — Table creation + migrations
  repositories/           — SQL queries per table
    members.ts
    reservations.ts
    proposals.ts
    proposal-items.ts
    sent-emails.ts
  services/
    proposal.ts           — Proposal business logic
    member.ts             — Member/reservation CRUD logic
  domain/proposal.ts      — Pure domain functions
  types.ts                — Domain types, categories, item lists
  validations.ts          — Zod schemas
  errors.ts               — Typed error classes
  events.ts               — Server-Sent Events bus
  seed.ts                 — Idempotent dev seed data
  timezone.ts             — Date/time utility functions

tests/
  setup.ts                — In-memory test DB factory
  domain/                 — Domain function tests
  services/               — Service layer tests
  repositories/           — Repository tests (in-memory SQLite)
  api/                    — Route handler integration tests

scripts/
  seed.ts                 — Standalone DB initialization script
```

## Data Model

```
members
  └── reservations
        └── proposals
              ├── proposal_items
              └── sent_emails
```

All monetary values stored as integer minor units (cents). `$1,250.50` → `125050`.

Proposal status lifecycle: `draft → sent → approved → paid`

Invalid transitions return HTTP 409 Conflict.

## Seed Data

- **Member:** James Whitfield (`james.whitfield@example.com`)
- **Reservation:** Villa Punta Mita, Mexico, March 15–22

The seed script is idempotent — safe to run repeatedly without overwriting existing data.

## API

### Proposals

| Method   | Route                                | Description                         | Status Codes            |
| -------- | ------------------------------------ | ----------------------------------- | ----------------------- |
| `POST`   | `/api/proposals`                     | Create draft proposal               | 201, 400, 404, 500      |
| `GET`    | `/api/proposals`                     | List all proposals with summaries   | 200, 500                |
| `GET`    | `/api/proposals/[id]`                | Get proposal detail + items + total | 200, 400, 404, 500      |
| `PATCH`  | `/api/proposals/[id]`                | Update status (approve or pay)      | 200, 400, 404, 409, 500 |
| `POST`   | `/api/proposals/[id]/send`           | Send proposal (draft → sent)        | 200, 400, 404, 409, 500 |
| `PATCH`  | `/api/proposals/[id]/notes`          | Update notes (draft only, ≤2000)    | 200, 400, 404, 409, 500 |
| `POST`   | `/api/proposals/[id]/items`          | Add itinerary item (draft only)     | 201, 400, 404, 409, 500 |
| `PATCH`  | `/api/proposals/[id]/items/[itemId]` | Update item (draft only)            | 200, 400, 404, 409, 500 |
| `DELETE` | `/api/proposals/[id]/items/[itemId]` | Remove item (draft only)            | 200, 400, 404, 409, 500 |

### Members

| Method   | Route               | Description      | Status Codes            |
| -------- | ------------------- | ---------------- | ----------------------- |
| `GET`    | `/api/members`      | List all members | 200, 500                |
| `POST`   | `/api/members`      | Create member    | 201, 400, 409, 500      |
| `GET`    | `/api/members/[id]` | Get member by ID | 200, 400, 404, 500      |
| `PATCH`  | `/api/members/[id]` | Update member    | 200, 400, 404, 409, 500 |
| `DELETE` | `/api/members/[id]` | Delete member    | 200, 400, 404, 409, 500 |

### Reservations

| Method   | Route                            | Description                     | Status Codes            |
| -------- | -------------------------------- | ------------------------------- | ----------------------- |
| `GET`    | `/api/reservations`              | Get default seeded reservation  | 200, 404, 500           |
| `GET`    | `/api/members/[id]/reservations` | List reservations for a member  | 200, 400, 404, 500      |
| `POST`   | `/api/members/[id]/reservations` | Create reservation for a member | 201, 400, 404, 500      |
| `GET`    | `/api/reservations/[id]`         | Get reservation by ID           | 200, 400, 404, 500      |
| `PATCH`  | `/api/reservations/[id]`         | Update reservation              | 200, 400, 404, 500      |
| `DELETE` | `/api/reservations/[id]`         | Delete reservation              | 200, 400, 404, 409, 500 |

### Events & Admin

| Method | Route                 | Description                                            |
| ------ | --------------------- | ------------------------------------------------------ |
| `GET`  | `/api/events`         | SSE stream for real-time proposal change notifications |
| `GET`  | `/api/admin/reset-db` | Drop all tables, recreate schema, re-seed              |

### Response Format

All API routes return:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

### Real-Time Updates

The dashboard subscribes to a Server-Sent Events stream at `/api/events`. Every write operation (create, update, delete proposal/items/notes/send) emits a `proposals:changed` event. The SSE endpoint relays these to connected clients with a 15-second heartbeat.

## Design Tokens

| Token          | Value     | Usage                        |
| -------------- | --------- | ---------------------------- |
| `--background` | `#fdfbf7` | Page background (warm ivory) |
| `--foreground` | `#2d2d2d` | Primary text (charcoal)      |
| `--accent`     | `#b8956a` | Accent (champagne/bronze)    |
| `--muted`      | `#57524e` | Secondary text               |
| `--border`     | `#cbc9c9` | Subtle borders               |
| `--surface`    | `#f5f2ec` | Card/surface background      |

Fonts: Geist Sans (body), Geist Mono (monospace), Cormorant Garamond (serif headings — member page).

## Itinerary Categories

| Category      | Label       | Items                                                   |
| ------------- | ----------- | ------------------------------------------------------- |
| `dining`      | Dining      | Private Chef Dinner, Restaurant Reservation             |
| `activities`  | Activities  | Surf Lesson, Snorkeling, ATV Tour                       |
| `wellness`    | Wellness    | Spa Treatment, Yoga Session, Massage                    |
| `excursions`  | Excursions  | Whale Watching, Sailing Charter, Cultural Tour          |
| `transport`   | Transport   | Airport Transfer, Private Car, Helicopter               |
| `experiences` | Experiences | Sunset Cocktails, Bonfire on the Beach, Tequila Tasting |

Categories are defined as typed domain constants in `lib/types.ts`, enforced by Zod validation and SQLite CHECK constraints.

## Testing

159 tests across 13 files:

- **Domain tests** (2 files) — Status transition matrix (all 16 combinations), total calculation, full lifecycle at repository level
- **Service tests** (1 file) — Business logic: create, add/update/remove items, get, list, send, approve, pay, pricing, notes, error cases
- **Repository tests** (6 files) — CRUD operations, queries, cascade deletes, foreign key enforcement, pricing integrity
- **API tests** (4 files) — Route handlers: HTTP status codes, request validation, full proposal workflow, member proposal lifecycle, notes management

Tests use isolated in-memory SQLite databases. No external services required.

```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```

## Design Decisions

**No ORM** — `better-sqlite3` is synchronous and simple. An ORM would add abstraction without benefit at this scale.

**Server Components by default** — Only interactive components are Client Components: `RootClient`, `DashboardClient`, `MemberList`, `ReservationList`, `ProposalHistory`, `ProposalEditor`, `ProposalSendButton`, `ProposalPreviewModal`, `ItemBuilder`, `ItemEditorInline`, `ItineraryList`, `EntityModal`, `ProposalActions`, `ConfirmationView`. Everything else renders on the server.

**Zod for validation** — All request bodies validated server-side. Client input is never trusted.

**Notes feature** — Concierge can write a personal message visible on the member proposal page. Stored on the proposal, editable only while in `draft` state (max 2000 characters).

**Real-time dashboard** — Server-Sent Events push proposal change notifications to the dashboard without requiring page refreshes. The event bus is a Node.js EventEmitter singleton on `globalThis`.

**Two-step send** — Proposal send requires a confirmation click to prevent accidental sends. The proposal URL is logged to both the server terminal and browser console.

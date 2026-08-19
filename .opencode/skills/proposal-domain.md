---
name: Proposal Domain & Workflow
description: Business rules for the concierge itinerary proposal workflow.
---

## Core entities

The system contains:

Member
Reservation
Proposal
ProposalItem
SentEmail

Relationship:

Member
└── Reservation
└── Proposal
├── ProposalItem
└── SentEmail

## Proposal lifecycle

A proposal follows:

draft → sent → approved → paid

These states represent meaningful business milestones.

### draft

The concierge is still preparing the proposal.

The concierge can:

- add items,
- remove items,
- edit items,
- preview the proposal.

### sent

The proposal has been sent to the member.

The member can review and approve it.

### approved

The member has approved the itinerary.

The member can proceed to payment.

### paid

The itinerary is considered locked in.

Paid proposals are immutable from the normal UI.

## State transitions

Only allow:

draft → sent
sent → approved
approved → paid

Reject all other transitions.

## Proposal items

Each item contains:

- category,
- title,
- description,
- scheduled date/time,
- price.

Items belong to exactly one proposal.

## Pricing

The proposal total is derived from its items.

Do not persist a duplicated proposal total unless there is a clear reason.

Calculate:

total = sum(proposal_items.price)

The server is authoritative for pricing.

Never trust a client-provided total.

## Sending

Sending a proposal must:

1. verify the proposal exists,
2. verify it is currently a draft,
3. update status to sent,
4. set sent_at,
5. create a sent_emails record,
6. log the proposal URL.

These operations should occur atomically.

## Approval

Approval must only be possible for a sent proposal.

## Payment

Payment must only be possible for an approved proposal.

This is simulated payment. No real payment provider is required.

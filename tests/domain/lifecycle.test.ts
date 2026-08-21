import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import {
  createProposal,
  getProposalById,
  updateProposalStatus,
} from "@/lib/repositories/proposals";
import {
  createProposalItem,
  getProposalItemsByProposalId,
} from "@/lib/repositories/proposal-items";
import { createSentEmail } from "@/lib/repositories/sent-emails";
import { canTransitionProposalStatus } from "@/lib/domain/proposal";

describe("proposal lifecycle", () => {
  let db: Database.Database;
  let memberId: number;
  let reservationId: number;

  beforeEach(() => {
    db = createTestDatabase();
    const member = createMember(db, {
      name: "Test Member",
      email: "test@example.com",
    });
    memberId = member.id;
    const reservation = createReservation(db, {
      memberId,
      destination: "Mexico",
      villa: "Test Villa",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    reservationId = reservation.id;
  });

  it("full lifecycle: draft → sent → approved → paid", () => {
    // Create draft proposal
    const proposal = createProposal(db, reservationId);
    expect(proposal.status).toBe("draft");
    expect(proposal.sentAt).toBeNull();

    // Add items
    const item1 = createProposalItem(db, {
      proposalId: proposal.id,
      category: "dining",
      title: "Private Chef Dinner",
      description: "Multi-course tasting menu",
      scheduledAt: "2025-03-16T19:00:00.000Z",
      price: 45000,
    });
    const item2 = createProposalItem(db, {
      proposalId: proposal.id,
      category: "activities",
      title: "Surf Lesson",
      description: "Beginner friendly",
      scheduledAt: "2025-03-17T10:00:00.000Z",
      price: 12000,
    });
    expect(item1.id).toBeDefined();
    expect(item2.id).toBeDefined();

    // Verify items retrieved
    const items = getProposalItemsByProposalId(db, proposal.id);
    expect(items).toHaveLength(2);

    // Transition to sent
    expect(canTransitionProposalStatus("draft", "sent")).toBe(true);
    const sentAt = new Date().toISOString();
    updateProposalStatus(db, proposal.id, "sent", sentAt);

    // Record sent email
    const email = createSentEmail(db, {
      proposalId: proposal.id,
      toEmail: "test@example.com",
      sentAt,
      bodyPreview: "Your itinerary awaits",
    });
    expect(email.id).toBeDefined();

    // Verify sent state
    const sentProposal = getProposalById(db, proposal.id);
    expect(sentProposal?.status).toBe("sent");
    expect(sentProposal?.sentAt).toBe(sentAt);

    // Transition to approved
    expect(canTransitionProposalStatus("sent", "approved")).toBe(true);
    updateProposalStatus(db, proposal.id, "approved");

    const approvedProposal = getProposalById(db, proposal.id);
    expect(approvedProposal?.status).toBe("approved");

    // Transition to paid
    expect(canTransitionProposalStatus("approved", "paid")).toBe(true);
    updateProposalStatus(db, proposal.id, "paid");

    const paidProposal = getProposalById(db, proposal.id);
    expect(paidProposal?.status).toBe("paid");
  });

  it("rejects invalid transitions at domain level", () => {
    expect(canTransitionProposalStatus("draft", "approved")).toBe(false);
    expect(canTransitionProposalStatus("draft", "paid")).toBe(false);
    expect(canTransitionProposalStatus("sent", "paid")).toBe(false);
    expect(canTransitionProposalStatus("paid", "draft")).toBe(false);
    expect(canTransitionProposalStatus("paid", "sent")).toBe(false);
    expect(canTransitionProposalStatus("paid", "approved")).toBe(false);
  });

  it("cannot transition a paid proposal", () => {
    const proposal = createProposal(db, reservationId);
    updateProposalStatus(db, proposal.id, "sent");
    updateProposalStatus(db, proposal.id, "approved");
    updateProposalStatus(db, proposal.id, "paid");

    expect(canTransitionProposalStatus("paid", "draft")).toBe(false);
    expect(canTransitionProposalStatus("paid", "sent")).toBe(false);
    expect(canTransitionProposalStatus("paid", "approved")).toBe(false);
    expect(canTransitionProposalStatus("paid", "paid")).toBe(false);
  });
});

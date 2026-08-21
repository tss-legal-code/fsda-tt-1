import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import { createProposal } from "@/lib/repositories/proposals";
import {
  createSentEmail,
  getSentEmailsByProposalId,
} from "@/lib/repositories/sent-emails";

describe("sent-emails repository", () => {
  let db: Database.Database;
  let proposalId: number;

  beforeEach(() => {
    db = createTestDatabase();
    const member = createMember(db, {
      name: "Test Member",
      email: "test@example.com",
    });
    const reservation = createReservation(db, {
      memberId: member.id,
      destination: "Mexico",
      villa: "Test Villa",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    const proposal = createProposal(db, reservation.id);
    proposalId = proposal.id;
  });

  it("creates and retrieves a sent email", () => {
    const email = createSentEmail(db, {
      proposalId,
      toEmail: "test@example.com",
      sentAt: "2025-03-10T10:00:00.000Z",
      bodyPreview: "Your itinerary is ready",
    });
    expect(email.id).toBeGreaterThan(0);
    expect(email.toEmail).toBe("test@example.com");

    const emails = getSentEmailsByProposalId(db, proposalId);
    expect(emails).toHaveLength(1);
    expect(emails[0].bodyPreview).toBe("Your itinerary is ready");
  });

  it("returns empty array when no emails sent", () => {
    expect(getSentEmailsByProposalId(db, proposalId)).toHaveLength(0);
  });

  it("restricts deletion of proposal with sent emails", () => {
    createSentEmail(db, {
      proposalId,
      toEmail: "test@example.com",
      sentAt: "2025-03-10T10:00:00.000Z",
      bodyPreview: "Preview",
    });
    expect(() =>
      db.prepare("DELETE FROM proposals WHERE id = ?").run(proposalId),
    ).toThrow();
  });
});

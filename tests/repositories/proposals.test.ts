import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import {
  createProposal,
  getProposalById,
  listProposals,
  updateProposalStatus,
} from "@/lib/repositories/proposals";

describe("proposals repository", () => {
  let db: Database.Database;
  let reservationId: number;

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
    reservationId = reservation.id;
  });

  it("creates a proposal with draft status", () => {
    const proposal = createProposal(db, reservationId);
    expect(proposal.id).toBeGreaterThan(0);
    expect(proposal.status).toBe("draft");
    expect(proposal.reservationId).toBe(reservationId);
    expect(proposal.sentAt).toBeNull();
  });

  it("retrieves a proposal by id", () => {
    const created = createProposal(db, reservationId);
    const found = getProposalById(db, created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.status).toBe("draft");
  });

  it("returns undefined for non-existent proposal", () => {
    expect(getProposalById(db, 999)).toBeUndefined();
  });

  it("lists proposals with reservation and member data", () => {
    createProposal(db, reservationId);
    createProposal(db, reservationId);
    const proposals = listProposals(db);
    expect(proposals).toHaveLength(2);
    expect(proposals[0].reservation).toBeDefined();
    expect(proposals[0].reservation.member).toBeDefined();
    expect(proposals[0].reservation.member.name).toBe("Test Member");
  });

  it("updates proposal status", () => {
    const proposal = createProposal(db, reservationId);
    updateProposalStatus(db, proposal.id, "sent", new Date().toISOString());
    const updated = getProposalById(db, proposal.id);
    expect(updated?.status).toBe("sent");
    expect(updated?.sentAt).not.toBeNull();
  });

  it("updates status without sent_at", () => {
    const proposal = createProposal(db, reservationId);
    updateProposalStatus(db, proposal.id, "sent");
    const updated = getProposalById(db, proposal.id);
    expect(updated?.status).toBe("sent");
  });
});

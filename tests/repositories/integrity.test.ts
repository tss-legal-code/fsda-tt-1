import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import { createProposal } from "@/lib/repositories/proposals";
import {
  createProposalItem,
  getProposalItemsByProposalId,
} from "@/lib/repositories/proposal-items";
import { calculateProposalTotal } from "@/lib/domain/proposal";

describe("proposal total pricing", () => {
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

  it("calculates total from persisted items", () => {
    createProposalItem(db, {
      proposalId,
      category: "dining",
      title: "Private Chef Dinner",
      description: "",
      scheduledAt: "2025-03-16T19:00:00.000Z",
      price: 45000,
    });
    createProposalItem(db, {
      proposalId,
      category: "activities",
      title: "Surf Lesson",
      description: "",
      scheduledAt: "2025-03-17T10:00:00.000Z",
      price: 12000,
    });
    createProposalItem(db, {
      proposalId,
      category: "wellness",
      title: "Spa Treatment",
      description: "",
      scheduledAt: "2025-03-18T14:00:00.000Z",
      price: 25000,
    });

    const items = getProposalItemsByProposalId(db, proposalId);
    expect(items).toHaveLength(3);
    expect(calculateProposalTotal(items)).toBe(82000);
  });

  it("returns 0 for proposal with no items", () => {
    const items = getProposalItemsByProposalId(db, proposalId);
    expect(calculateProposalTotal(items)).toBe(0);
  });

  it("enforces foreign key: cannot create item for non-existent proposal", () => {
    expect(() =>
      createProposalItem(db, {
        proposalId: 99999,
        category: "dining",
        title: "Test",
        description: "",
        scheduledAt: "2025-03-16T10:00:00.000Z",
        price: 1000,
      }),
    ).toThrow();
  });

  it("enforces foreign key: cannot create proposal for non-existent reservation", () => {
    expect(() => createProposal(db, 99999)).toThrow();
  });

  it("enforces foreign key: cannot create reservation for non-existent member", () => {
    expect(() =>
      createReservation(db, {
        memberId: 99999,
        destination: "Test",
        villa: "Test",
        arrivalDate: "2025-03-15",
        departureDate: "2025-03-22",
      }),
    ).toThrow();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import { createProposal } from "@/lib/repositories/proposals";
import {
  createProposalItem,
  getProposalItemsByProposalId,
  updateProposalItem,
  deleteProposalItem,
} from "@/lib/repositories/proposal-items";

describe("proposal-items repository", () => {
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

  it("creates and retrieves a proposal item", () => {
    const item = createProposalItem(db, {
      proposalId,
      category: "dining",
      title: "Private Chef Dinner",
      description: "Multi-course meal",
      scheduledAt: "2025-03-16T19:00:00.000Z",
      price: 45000,
    });
    expect(item.id).toBeGreaterThan(0);
    expect(item.category).toBe("dining");
    expect(item.price).toBe(45000);

    const items = getProposalItemsByProposalId(db, proposalId);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(item.id);
  });

  it("returns empty array for proposal with no items", () => {
    expect(getProposalItemsByProposalId(db, proposalId)).toHaveLength(0);
  });

  it("updates proposal item fields", () => {
    const item = createProposalItem(db, {
      proposalId,
      category: "dining",
      title: "Dinner",
      description: "",
      scheduledAt: "2025-03-16T19:00:00.000Z",
      price: 10000,
    });

    updateProposalItem(db, item.id, {
      title: "Private Chef Dinner",
      price: 45000,
    });

    const items = getProposalItemsByProposalId(db, proposalId);
    expect(items[0].title).toBe("Private Chef Dinner");
    expect(items[0].price).toBe(45000);
  });

  it("deletes a proposal item", () => {
    const item = createProposalItem(db, {
      proposalId,
      category: "activities",
      title: "Surf Lesson",
      description: "",
      scheduledAt: "2025-03-17T10:00:00.000Z",
      price: 12000,
    });
    expect(getProposalItemsByProposalId(db, proposalId)).toHaveLength(1);

    deleteProposalItem(db, item.id);
    expect(getProposalItemsByProposalId(db, proposalId)).toHaveLength(0);
  });

  it("cascades delete when proposal is deleted", () => {
    createProposalItem(db, {
      proposalId,
      category: "wellness",
      title: "Massage",
      description: "",
      scheduledAt: "2025-03-18T14:00:00.000Z",
      price: 20000,
    });
    expect(getProposalItemsByProposalId(db, proposalId)).toHaveLength(1);

    db.prepare("DELETE FROM proposals WHERE id = ?").run(proposalId);
    expect(getProposalItemsByProposalId(db, proposalId)).toHaveLength(0);
  });

  it("rejects item with invalid category via check constraint", () => {
    expect(() =>
      db
        .prepare(
          "INSERT INTO proposal_items (proposal_id, category, title, description, scheduled_at, price) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          proposalId,
          "invalid",
          "Test",
          "",
          "2025-03-16T10:00:00.000Z",
          1000,
        ),
    ).toThrow();
  });

  it("rejects negative price via check constraint", () => {
    expect(() =>
      db
        .prepare(
          "INSERT INTO proposal_items (proposal_id, category, title, description, scheduled_at, price) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(
          proposalId,
          "dining",
          "Test",
          "",
          "2025-03-16T10:00:00.000Z",
          -100,
        ),
    ).toThrow();
  });
});

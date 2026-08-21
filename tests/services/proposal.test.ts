import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import {
  ReservationNotFoundError,
  ProposalNotFoundError,
  InvalidProposalTransitionError,
  ProposalLockedError,
} from "@/lib/errors";
import {
  getReservation,
  createProposal,
  addProposalItem,
  updateProposalItem,
  removeProposalItem,
  getProposal,
  listProposals,
  sendProposal,
  approveProposal,
  payProposal,
} from "@/lib/services/proposal";

describe("proposal services", () => {
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

  describe("getReservation", () => {
    it("returns the reservation with member data", () => {
      const result = getReservation(db);
      expect(result.destination).toBe("Mexico");
      expect(result.villa).toBe("Test Villa");
      expect(result.member.name).toBe("Test Member");
    });

    it("throws ReservationNotFoundError when no reservation exists", () => {
      const emptyDb = createTestDatabase();
      expect(() => getReservation(emptyDb)).toThrow(ReservationNotFoundError);
    });
  });

  describe("createProposal", () => {
    it("creates a draft proposal for a valid reservation", () => {
      const proposal = createProposal(db, reservationId);
      expect(proposal.id).toBeGreaterThan(0);
      expect(proposal.status).toBe("draft");
      expect(proposal.reservationId).toBe(reservationId);
      expect(proposal.sentAt).toBeNull();
    });

    it("throws ReservationNotFoundError for non-existent reservation", () => {
      expect(() => createProposal(db, 99999)).toThrow(ReservationNotFoundError);
    });
  });

  describe("addProposalItem", () => {
    it("adds an item to a draft proposal", () => {
      const proposal = createProposal(db, reservationId);
      const item = addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Private Chef Dinner",
        description: "Multi-course tasting menu",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 45000,
      });
      expect(item.id).toBeGreaterThan(0);
      expect(item.title).toBe("Private Chef Dinner");
      expect(item.price).toBe(45000);
    });

    it("throws ProposalLockedError for sent proposal", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      expect(() =>
        addProposalItem(db, proposal.id, {
          category: "dining",
          title: "Dinner",
          description: "",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          price: 10000,
        }),
      ).toThrow(ProposalLockedError);
    });

    it("throws ProposalLockedError for approved proposal", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      expect(() =>
        addProposalItem(db, proposal.id, {
          category: "dining",
          title: "Dinner",
          description: "",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          price: 10000,
        }),
      ).toThrow(ProposalLockedError);
    });

    it("throws ProposalLockedError for paid proposal", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      payProposal(db, proposal.id);
      expect(() =>
        addProposalItem(db, proposal.id, {
          category: "dining",
          title: "Dinner",
          description: "",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          price: 10000,
        }),
      ).toThrow(ProposalLockedError);
    });

    it("throws ProposalNotFoundError for non-existent proposal", () => {
      expect(() =>
        addProposalItem(db, 99999, {
          category: "dining",
          title: "Dinner",
          description: "",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          price: 10000,
        }),
      ).toThrow(ProposalNotFoundError);
    });
  });

  describe("updateProposalItem", () => {
    it("updates an item on a draft proposal", () => {
      const proposal = createProposal(db, reservationId);
      const item = addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });

      updateProposalItem(db, proposal.id, item.id, {
        title: "Private Chef Dinner",
        price: 45000,
      });

      const detail = getProposal(db, proposal.id);
      expect(detail.items[0].title).toBe("Private Chef Dinner");
      expect(detail.items[0].price).toBe(45000);
    });

    it("throws ProposalLockedError for sent proposal", () => {
      const proposal = createProposal(db, reservationId);
      const item = addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });
      sendProposal(db, proposal.id, "http://localhost:3000");
      expect(() =>
        updateProposalItem(db, proposal.id, item.id, { title: "Updated" }),
      ).toThrow(ProposalLockedError);
    });
  });

  describe("removeProposalItem", () => {
    it("removes an item from a draft proposal", () => {
      const proposal = createProposal(db, reservationId);
      const item = addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });
      expect(getProposal(db, proposal.id).items).toHaveLength(1);

      removeProposalItem(db, proposal.id, item.id);
      expect(getProposal(db, proposal.id).items).toHaveLength(0);
    });

    it("throws ProposalLockedError for sent proposal", () => {
      const proposal = createProposal(db, reservationId);
      const item = addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });
      sendProposal(db, proposal.id, "http://localhost:3000");
      expect(() => removeProposalItem(db, proposal.id, item.id)).toThrow(
        ProposalLockedError,
      );
    });
  });

  describe("getProposal", () => {
    it("returns proposal with items and correct total", () => {
      const proposal = createProposal(db, reservationId);
      addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Private Chef Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 45000,
      });
      addProposalItem(db, proposal.id, {
        category: "activities",
        title: "Surf Lesson",
        description: "",
        scheduledAt: "2025-03-17T10:00:00.000Z",
        price: 12000,
      });

      const detail = getProposal(db, proposal.id);
      expect(detail.proposal.id).toBe(proposal.id);
      expect(detail.reservation.villa).toBe("Test Villa");
      expect(detail.reservation.member.name).toBe("Test Member");
      expect(detail.items).toHaveLength(2);
      expect(detail.total).toBe(57000);
    });

    it("returns zero total for proposal with no items", () => {
      const proposal = createProposal(db, reservationId);
      const detail = getProposal(db, proposal.id);
      expect(detail.items).toHaveLength(0);
      expect(detail.total).toBe(0);
    });

    it("throws ProposalNotFoundError for missing proposal", () => {
      expect(() => getProposal(db, 99999)).toThrow(ProposalNotFoundError);
    });
  });

  describe("listProposals", () => {
    it("returns proposals with correct totals", () => {
      const proposal = createProposal(db, reservationId);
      addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 25000,
      });

      const summaries = listProposals(db);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].proposal.id).toBe(proposal.id);
      expect(summaries[0].total).toBe(25000);
      expect(summaries[0].reservation.member.name).toBe("Test Member");
    });

    it("returns empty array when no proposals exist", () => {
      expect(listProposals(db)).toHaveLength(0);
    });
  });

  describe("sendProposal", () => {
    it("transitions draft to sent", () => {
      const proposal = createProposal(db, reservationId);
      const sent = sendProposal(db, proposal.id, "http://localhost:3000");
      expect(sent.status).toBe("sent");
      expect(sent.sentAt).not.toBeNull();
    });

    it("creates a sent email record", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");

      const emails = db
        .prepare("SELECT * FROM sent_emails WHERE proposal_id = ?")
        .all(proposal.id) as { to_email: string; body_preview: string }[];
      expect(emails).toHaveLength(1);
      expect(emails[0].to_email).toBe("test@example.com");
      expect(emails[0].body_preview).toContain("Test Villa");
    });

    it("generates proposal URL in email body", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");

      const email = db
        .prepare("SELECT body_preview FROM sent_emails WHERE proposal_id = ?")
        .get(proposal.id) as { body_preview: string };
      expect(email.body_preview).toContain(
        `http://localhost:3000/proposal/${proposal.id}`,
      );
    });

    it("throws InvalidProposalTransitionError for already sent proposal", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      expect(() =>
        sendProposal(db, proposal.id, "http://localhost:3000"),
      ).toThrow(InvalidProposalTransitionError);
    });

    it("throws InvalidProposalTransitionError for approved proposal", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      expect(() =>
        sendProposal(db, proposal.id, "http://localhost:3000"),
      ).toThrow(InvalidProposalTransitionError);
    });

    it("throws ProposalNotFoundError for missing proposal", () => {
      expect(() => sendProposal(db, 99999, "http://localhost:3000")).toThrow(
        ProposalNotFoundError,
      );
    });
  });

  describe("approveProposal", () => {
    it("transitions sent to approved", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      const approved = approveProposal(db, proposal.id);
      expect(approved.status).toBe("approved");
    });

    it("throws InvalidProposalTransitionError for draft", () => {
      const proposal = createProposal(db, reservationId);
      expect(() => approveProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws InvalidProposalTransitionError for already approved", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      expect(() => approveProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws InvalidProposalTransitionError for paid", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      payProposal(db, proposal.id);
      expect(() => approveProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws ProposalNotFoundError for missing proposal", () => {
      expect(() => approveProposal(db, 99999)).toThrow(ProposalNotFoundError);
    });
  });

  describe("payProposal", () => {
    it("transitions approved to paid", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      const paid = payProposal(db, proposal.id);
      expect(paid.status).toBe("paid");
    });

    it("throws InvalidProposalTransitionError for draft", () => {
      const proposal = createProposal(db, reservationId);
      expect(() => payProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws InvalidProposalTransitionError for sent", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      expect(() => payProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws InvalidProposalTransitionError for already paid", () => {
      const proposal = createProposal(db, reservationId);
      sendProposal(db, proposal.id, "http://localhost:3000");
      approveProposal(db, proposal.id);
      payProposal(db, proposal.id);
      expect(() => payProposal(db, proposal.id)).toThrow(
        InvalidProposalTransitionError,
      );
    });

    it("throws ProposalNotFoundError for missing proposal", () => {
      expect(() => payProposal(db, 99999)).toThrow(ProposalNotFoundError);
    });
  });

  describe("full lifecycle", () => {
    it("create → add items → send → approve → pay", () => {
      const proposal = createProposal(db, reservationId);
      expect(proposal.status).toBe("draft");

      addProposalItem(db, proposal.id, {
        category: "dining",
        title: "Private Chef Dinner",
        description: "Multi-course tasting menu",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 45000,
      });
      addProposalItem(db, proposal.id, {
        category: "activities",
        title: "Surf Lesson",
        description: "Beginner friendly",
        scheduledAt: "2025-03-17T10:00:00.000Z",
        price: 12000,
      });

      const detail = getProposal(db, proposal.id);
      expect(detail.items).toHaveLength(2);
      expect(detail.total).toBe(57000);

      const sent = sendProposal(db, proposal.id, "http://localhost:3000");
      expect(sent.status).toBe("sent");
      expect(sent.sentAt).not.toBeNull();

      const approved = approveProposal(db, proposal.id);
      expect(approved.status).toBe("approved");

      const paid = payProposal(db, proposal.id);
      expect(paid.status).toBe("paid");

      const finalDetail = getProposal(db, proposal.id);
      expect(finalDetail.proposal.status).toBe("paid");
      expect(finalDetail.items).toHaveLength(2);
      expect(finalDetail.total).toBe(57000);

      expect(() =>
        addProposalItem(db, proposal.id, {
          category: "dining",
          title: "Late Night Snack",
          description: "",
          scheduledAt: "2025-03-17T23:00:00.000Z",
          price: 5000,
        }),
      ).toThrow(ProposalLockedError);
    });
  });

  describe("pricing", () => {
    it("calculates total from service-layer retrieved items", () => {
      const proposal = createProposal(db, reservationId);
      addProposalItem(db, proposal.id, {
        category: "wellness",
        title: "Spa Treatment",
        description: "",
        scheduledAt: "2025-03-18T14:00:00.000Z",
        price: 25000,
      });
      addProposalItem(db, proposal.id, {
        category: "transport",
        title: "Airport Transfer",
        description: "",
        scheduledAt: "2025-03-15T12:00:00.000Z",
        price: 8000,
      });
      addProposalItem(db, proposal.id, {
        category: "experiences",
        title: "Sunset Cocktails",
        description: "",
        scheduledAt: "2025-03-16T17:00:00.000Z",
        price: 0,
      });

      const detail = getProposal(db, proposal.id);
      expect(detail.total).toBe(33000);
    });
  });
});

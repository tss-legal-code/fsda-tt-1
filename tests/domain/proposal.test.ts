import { describe, it, expect } from "vitest";
import {
  canTransitionProposalStatus,
  calculateProposalTotal,
} from "@/lib/domain/proposal";
import type { ProposalItem, ProposalStatus } from "@/lib/types";

describe("canTransitionProposalStatus", () => {
  it("allows draft → sent", () => {
    expect(canTransitionProposalStatus("draft", "sent")).toBe(true);
  });

  it("allows sent → approved", () => {
    expect(canTransitionProposalStatus("sent", "approved")).toBe(true);
  });

  it("allows approved → paid", () => {
    expect(canTransitionProposalStatus("approved", "paid")).toBe(true);
  });

  it("rejects draft → approved", () => {
    expect(canTransitionProposalStatus("draft", "approved")).toBe(false);
  });

  it("rejects draft → paid", () => {
    expect(canTransitionProposalStatus("draft", "paid")).toBe(false);
  });

  it("rejects sent → paid", () => {
    expect(canTransitionProposalStatus("sent", "paid")).toBe(false);
  });

  it("rejects approved → sent", () => {
    expect(canTransitionProposalStatus("approved", "sent")).toBe(false);
  });

  it("rejects paid → draft", () => {
    expect(canTransitionProposalStatus("paid", "draft")).toBe(false);
  });

  it("rejects paid → sent", () => {
    expect(canTransitionProposalStatus("paid", "sent")).toBe(false);
  });

  it("rejects paid → approved", () => {
    expect(canTransitionProposalStatus("paid", "approved")).toBe(false);
  });

  it("rejects same status to same status for paid", () => {
    expect(canTransitionProposalStatus("paid", "paid")).toBe(false);
  });

  const statuses: ProposalStatus[] = ["draft", "sent", "approved", "paid"];
  const validTransitions: [ProposalStatus, ProposalStatus][] = [
    ["draft", "sent"],
    ["sent", "approved"],
    ["approved", "paid"],
  ];

  for (const from of statuses) {
    for (const to of statuses) {
      const isValid = validTransitions.some(([f, t]) => f === from && t === to);
      it(`${from} → ${to} should be ${isValid ? "valid" : "invalid"}`, () => {
        expect(canTransitionProposalStatus(from, to)).toBe(isValid);
      });
    }
  }
});

describe("calculateProposalTotal", () => {
  it("returns 0 for empty items", () => {
    expect(calculateProposalTotal([])).toBe(0);
  });

  it("returns single item price", () => {
    const items: ProposalItem[] = [
      {
        id: 1,
        proposalId: 1,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 15000,
      },
    ];
    expect(calculateProposalTotal(items)).toBe(15000);
  });

  it("sums multiple item prices", () => {
    const items: ProposalItem[] = [
      {
        id: 1,
        proposalId: 1,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 15000,
      },
      {
        id: 2,
        proposalId: 1,
        category: "activities",
        title: "Surf Lesson",
        description: "",
        scheduledAt: "2025-03-17T10:00:00.000Z",
        price: 125050,
      },
    ];
    expect(calculateProposalTotal(items)).toBe(140050);
  });

  it("handles zero-price items", () => {
    const items: ProposalItem[] = [
      {
        id: 1,
        proposalId: 1,
        category: "experiences",
        title: "Sunset Cocktails",
        description: "",
        scheduledAt: "2025-03-16T17:00:00.000Z",
        price: 0,
      },
    ];
    expect(calculateProposalTotal(items)).toBe(0);
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createSchema } from "@/lib/db/schema";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import { createProposal } from "@/lib/repositories/proposals";
import { createProposalItem } from "@/lib/repositories/proposal-items";
import { updateProposalStatus } from "@/lib/repositories/proposals";

let testDb: Database.Database;

vi.mock("@/lib/db", () => ({
  getDatabase: () => testDb,
}));

function makeRequest(method: string, url: string, body?: unknown): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("Proposal items API", () => {
  let reservationId: number;
  let proposalId: number;

  beforeEach(() => {
    testDb = new Database(":memory:");
    createSchema(testDb);

    const member = createMember(testDb, {
      name: "Test Member",
      email: "test@example.com",
    });
    const reservation = createReservation(testDb, {
      memberId: member.id,
      destination: "Mexico",
      villa: "Test Villa",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    reservationId = reservation.id;
    const proposal = createProposal(testDb, reservationId);
    proposalId = proposal.id;
  });

  describe("POST /api/proposals/[id]/items", () => {
    it("adds an item to a draft proposal", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/items`,
        {
          category: "dining",
          title: "Private Chef Dinner",
          description: "Tasting menu",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      const data = body.data as Record<string, unknown>;
      expect(data.category).toBe("dining");
      expect(data.title).toBe("Private Chef Dinner");
      expect(data.price).toBe(45000);
    });

    it("returns 400 for missing title", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/items`,
        {
          category: "dining",
          title: "",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid category", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/items`,
        {
          category: "invalid",
          title: "Dinner",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for negative price", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/items`,
        {
          category: "dining",
          title: "Dinner",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: -100,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 404 for missing proposal", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        "http://localhost:3000/api/proposals/999/items",
        {
          category: "dining",
          title: "Dinner",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("returns 409 for sent proposal", async () => {
      updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());

      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/items`,
        {
          category: "dining",
          title: "Dinner",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(409);
    });

    it("returns 400 for non-numeric ID", async () => {
      const { POST } = await import("@/app/api/proposals/[id]/items/route");
      const request = makeRequest(
        "POST",
        "http://localhost:3000/api/proposals/abc/items",
        {
          category: "dining",
          title: "Dinner",
          scheduledAt: "2025-03-16T19:00:00.000Z",
          priceInCents: 45000,
        },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/proposals/[id]/items/[itemId]", () => {
    it("updates an item on a draft proposal", async () => {
      const item = createProposalItem(testDb, {
        proposalId,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });

      const { PATCH } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}/items/${item.id}`,
        { title: "Private Chef Dinner", priceInCents: 45000 },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({
          id: String(proposalId),
          itemId: String(item.id),
        }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 409 for sent proposal", async () => {
      const item = createProposalItem(testDb, {
        proposalId,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });
      updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());

      const { PATCH } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}/items/${item.id}`,
        { title: "Updated" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({
          id: String(proposalId),
          itemId: String(item.id),
        }),
      });
      expect(response.status).toBe(409);
    });

    it("returns 400 for invalid body", async () => {
      const item = createProposalItem(testDb, {
        proposalId,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });

      const { PATCH } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}/items/${item.id}`,
        { category: "invalid" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({
          id: String(proposalId),
          itemId: String(item.id),
        }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/proposals/[id]/items/[itemId]", () => {
    it("removes an item from a draft proposal", async () => {
      const item = createProposalItem(testDb, {
        proposalId,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });

      const { DELETE } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "DELETE",
        `http://localhost:3000/api/proposals/${proposalId}/items/${item.id}`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({
          id: String(proposalId),
          itemId: String(item.id),
        }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      const remaining = testDb
        .prepare("SELECT * FROM proposal_items WHERE id = ?")
        .get(item.id);
      expect(remaining).toBeUndefined();
    });

    it("returns 409 for sent proposal", async () => {
      const item = createProposalItem(testDb, {
        proposalId,
        category: "dining",
        title: "Dinner",
        description: "",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 10000,
      });
      updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());

      const { DELETE } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "DELETE",
        `http://localhost:3000/api/proposals/${proposalId}/items/${item.id}`,
      );
      const response = await DELETE(request, {
        params: Promise.resolve({
          id: String(proposalId),
          itemId: String(item.id),
        }),
      });
      expect(response.status).toBe(409);
    });

    it("returns 400 for non-numeric IDs", async () => {
      const { DELETE } = await import(
        "@/app/api/proposals/[id]/items/[itemId]/route"
      );
      const request = makeRequest(
        "DELETE",
        "http://localhost:3000/api/proposals/abc/items/def",
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: "abc", itemId: "def" }),
      });
      expect(response.status).toBe(400);
    });
  });
});

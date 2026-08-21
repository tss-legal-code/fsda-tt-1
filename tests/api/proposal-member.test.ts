import { describe, it, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createSchema } from "@/lib/db/schema";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import {
  createProposal,
  updateProposalStatus,
} from "@/lib/repositories/proposals";
import { createProposalItem } from "@/lib/repositories/proposal-items";

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

describe("Member proposal workflow", () => {
  let proposalId: number;

  beforeEach(() => {
    testDb = new Database(":memory:");
    createSchema(testDb);

    const member = createMember(testDb, {
      name: "James Whitfield",
      email: "james.whitfield@example.com",
    });
    const reservation = createReservation(testDb, {
      memberId: member.id,
      destination: "Mexico",
      villa: "Villa Punta Mita",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    const proposal = createProposal(testDb, reservation.id);
    proposalId = proposal.id;

    createProposalItem(testDb, {
      proposalId,
      category: "dining",
      title: "Private Chef Dinner",
      description: "Multi-course tasting menu",
      scheduledAt: "2025-03-16T19:00:00.000Z",
      price: 45000,
    });
    createProposalItem(testDb, {
      proposalId,
      category: "activities",
      title: "Snorkeling",
      description: "Guided reef tour",
      scheduledAt: "2025-03-17T10:00:00.000Z",
      price: 12000,
    });

    updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());
  });

  describe("GET proposal detail", () => {
    it("returns complete proposal with items and total", async () => {
      const { GET } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "GET",
        `http://localhost:3000/api/proposals/${proposalId}`,
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      const data = body.data as Record<string, unknown>;
      expect(data).toHaveProperty("proposal");
      expect(data).toHaveProperty("reservation");
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("total");

      const proposal = data.proposal as Record<string, unknown>;
      expect(proposal.status).toBe("sent");

      expect(data.total).toBe(57000);

      const items = data.items as unknown[];
      expect(items).toHaveLength(2);
    });

    it("returns member and reservation info", async () => {
      const { GET } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "GET",
        `http://localhost:3000/api/proposals/${proposalId}`,
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const body = await readJson(response);
      const data = body.data as Record<string, unknown>;
      const reservation = data.reservation as Record<string, unknown>;

      expect(reservation.villa).toBe("Villa Punta Mita");
      expect(reservation.destination).toBe("Mexico");

      const member = reservation.member as Record<string, unknown>;
      expect(member.name).toBe("James Whitfield");
    });
  });

  describe("Approve workflow (sent → approved)", () => {
    it("approves a sent proposal", async () => {
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect((body.data as Record<string, unknown>).status).toBe("approved");
    });

    it("cannot approve a draft proposal", async () => {
      const draftProposal = createProposal(testDb, 1);
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${draftProposal.id}`,
        { status: "approved" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: String(draftProposal.id) }),
      });
      expect(response.status).toBe(409);
    });

    it("cannot approve an already-approved proposal", async () => {
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const approveRequest = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      await PATCH(approveRequest, {
        params: Promise.resolve({ id: String(proposalId) }),
      });

      const secondRequest = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      const response = await PATCH(secondRequest, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(409);
    });
  });

  describe("Pay workflow (approved → paid)", () => {
    it("pays an approved proposal", async () => {
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );

      const approveReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      await PATCH(approveReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });

      const payReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "paid" },
      );
      const response = await PATCH(payReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect((body.data as Record<string, unknown>).status).toBe("paid");
    });

    it("cannot pay a sent proposal (must approve first)", async () => {
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "paid" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(response.status).toBe(409);
    });

    it("cannot pay a draft proposal", async () => {
      const draftProposal = createProposal(testDb, 1);
      const { PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${draftProposal.id}`,
        { status: "paid" },
      );
      const response = await PATCH(request, {
        params: Promise.resolve({ id: String(draftProposal.id) }),
      });
      expect(response.status).toBe(409);
    });
  });

  describe("Full member lifecycle", () => {
    it("sent → approved → paid", async () => {
      const { GET, PATCH } = await import(
        "@/app/api/proposals/[id]/route"
      );

      // 1. Fetch proposal — should be sent
      const getReq = makeRequest(
        "GET",
        `http://localhost:3000/api/proposals/${proposalId}`,
      );
      const getRes = await GET(getReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const getBody = await readJson(getRes);
      const getData = getBody.data as Record<string, unknown>;
      const proposal = getData.proposal as Record<string, unknown>;
      expect(proposal.status).toBe("sent");

      // 2. Approve
      const approveReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      const approveRes = await PATCH(approveReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(approveRes.status).toBe(200);

      // 3. Pay
      const payReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "paid" },
      );
      const payRes = await PATCH(payReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      expect(payRes.status).toBe(200);

      // 4. Verify final state
      const finalReq = makeRequest(
        "GET",
        `http://localhost:3000/api/proposals/${proposalId}`,
      );
      const finalRes = await GET(finalReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const finalBody = await readJson(finalRes);
      const finalData = finalBody.data as Record<string, unknown>;
      const finalProposal = finalData.proposal as Record<string, unknown>;
      expect(finalProposal.status).toBe("paid");

      // 5. Verify items still present
      const items = finalData.items as unknown[];
      expect(items).toHaveLength(2);
      expect(finalData.total).toBe(57000);
    });
  });

  describe("Missing proposal", () => {
    it("returns 404 for non-existent proposal", async () => {
      const { GET } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "GET",
        "http://localhost:3000/api/proposals/999",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("returns 400 for malformed ID", async () => {
      const { GET } = await import(
        "@/app/api/proposals/[id]/route"
      );
      const request = makeRequest(
        "GET",
        "http://localhost:3000/api/proposals/abc",
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(response.status).toBe(400);
    });
  });
});

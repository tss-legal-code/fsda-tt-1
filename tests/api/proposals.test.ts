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

async function importHandlers() {
  const reservations = await import("@/app/api/reservations/route");
  const proposalsList = await import("@/app/api/proposals/route");
  const proposalDetail = await import("@/app/api/proposals/[id]/route");
  const proposalSend = await import("@/app/api/proposals/[id]/send/route");
  return { reservations, proposalsList, proposalDetail, proposalSend };
}

function makeRequest(
  method: string,
  url: string,
  body?: unknown,
): Request {
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

describe("API route handlers", () => {
  let reservationId: number;

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
  });

  describe("GET /api/reservations", () => {
    it("returns 200 with reservation data", async () => {
      const { reservations } = await importHandlers();
      const response = await reservations.GET();
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        destination: "Mexico",
        villa: "Test Villa",
        member: { name: "Test Member", email: "test@example.com" },
      });
    });

    it("returns expected shape", async () => {
      const { reservations } = await importHandlers();
      const response = await reservations.GET();
      const body = await readJson(response);
      const data = body.data as Record<string, unknown>;

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("memberId");
      expect(data).toHaveProperty("destination");
      expect(data).toHaveProperty("villa");
      expect(data).toHaveProperty("arrivalDate");
      expect(data).toHaveProperty("departureDate");
      expect(data).toHaveProperty("member");
    });
  });

  describe("POST /api/proposals", () => {
    it("creates a proposal and returns 201", async () => {
      const { proposalsList } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals", {
        reservationId,
      });
      const response = await proposalsList.POST(request);
      const body = await readJson(response);

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect((body.data as Record<string, unknown>).status).toBe("draft");
      expect((body.data as Record<string, unknown>).reservationId).toBe(reservationId);
    });

    it("returns 400 for empty body", async () => {
      const { proposalsList } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals", {});
      const response = await proposalsList.POST(request);
      const body = await readJson(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("returns 400 for missing reservationId", async () => {
      const { proposalsList } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals", {
        foo: "bar",
      });
      const response = await proposalsList.POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const { proposalsList } = await importHandlers();
      const request = new Request("http://localhost:3000/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json",
      });
      const response = await proposalsList.POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 404 for non-existent reservation", async () => {
      const { proposalsList } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals", {
        reservationId: 99999,
      });
      const response = await proposalsList.POST(request);
      const body = await readJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("GET /api/proposals", () => {
    it("returns 200 with empty array when no proposals", async () => {
      const { proposalsList } = await importHandlers();
      const response = await proposalsList.GET();
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it("returns 200 with proposals", async () => {
      createProposal(testDb, reservationId);
      const { proposalsList } = await importHandlers();
      const response = await proposalsList.GET();
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.data as unknown[])).toHaveLength(1);
    });
  });

  describe("GET /api/proposals/[id]", () => {
    it("returns 200 with proposal detail", async () => {
      const proposal = createProposal(testDb, reservationId);
      createProposalItem(testDb, {
        proposalId: proposal.id,
        category: "dining",
        title: "Private Chef Dinner",
        description: "Tasting menu",
        scheduledAt: "2025-03-16T19:00:00.000Z",
        price: 45000,
      });

      const { proposalDetail } = await importHandlers();
      const request = makeRequest("GET", `http://localhost:3000/api/proposals/${proposal.id}`);
      const response = await proposalDetail.GET(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      const data = body.data as Record<string, unknown>;
      expect(data).toHaveProperty("proposal");
      expect(data).toHaveProperty("reservation");
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("total");
      expect(data.total).toBe(45000);
    });

    it("returns 404 for missing proposal", async () => {
      const { proposalDetail } = await importHandlers();
      const request = makeRequest("GET", "http://localhost:3000/api/proposals/999");
      const response = await proposalDetail.GET(request, {
        params: Promise.resolve({ id: "999" }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 400 for non-numeric ID", async () => {
      const { proposalDetail } = await importHandlers();
      const request = makeRequest("GET", "http://localhost:3000/api/proposals/abc");
      const response = await proposalDetail.GET(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("returns 400 for negative ID", async () => {
      const { proposalDetail } = await importHandlers();
      const request = makeRequest("GET", "http://localhost:3000/api/proposals/-1");
      const response = await proposalDetail.GET(request, {
        params: Promise.resolve({ id: "-1" }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/proposals/[id]", () => {
    it("returns 200 when approving a sent proposal", async () => {
      const proposal = createProposal(testDb, reservationId);
      updateProposalStatus(testDb, proposal.id, "sent", new Date().toISOString());

      const { proposalDetail } = await importHandlers();
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposal.id}`,
        { status: "approved" },
      );
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.data as Record<string, unknown>).status).toBe("approved");
    });

    it("returns 409 for invalid transition (draft → approved)", async () => {
      const proposal = createProposal(testDb, reservationId);

      const { proposalDetail } = await importHandlers();
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposal.id}`,
        { status: "approved" },
      );
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
    });

    it("returns 409 for invalid transition (sent → paid)", async () => {
      const proposal = createProposal(testDb, reservationId);
      updateProposalStatus(testDb, proposal.id, "sent", new Date().toISOString());

      const { proposalDetail } = await importHandlers();
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposal.id}`,
        { status: "paid" },
      );
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      expect(response.status).toBe(409);
    });

    it("returns 404 for missing proposal", async () => {
      const { proposalDetail } = await importHandlers();
      const request = makeRequest("PATCH", "http://localhost:3000/api/proposals/999", {
        status: "approved",
      });
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("returns 400 for invalid status value", async () => {
      const proposal = createProposal(testDb, reservationId);

      const { proposalDetail } = await importHandlers();
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposal.id}`,
        { status: "invalid" },
      );
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for missing status", async () => {
      const proposal = createProposal(testDb, reservationId);

      const { proposalDetail } = await importHandlers();
      const request = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposal.id}`,
        {},
      );
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for non-numeric ID", async () => {
      const { proposalDetail } = await importHandlers();
      const request = makeRequest("PATCH", "http://localhost:3000/api/proposals/abc", {
        status: "approved",
      });
      const response = await proposalDetail.PATCH(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/proposals/[id]/send", () => {
    it("returns 200 when sending a draft", async () => {
      const proposal = createProposal(testDb, reservationId);

      const { proposalSend } = await importHandlers();
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposal.id}/send`,
      );
      const response = await proposalSend.POST(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect((body.data as Record<string, unknown>).status).toBe("sent");
    });

    it("returns 409 when sending an already-sent proposal", async () => {
      const proposal = createProposal(testDb, reservationId);
      updateProposalStatus(testDb, proposal.id, "sent", new Date().toISOString());

      const { proposalSend } = await importHandlers();
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposal.id}/send`,
      );
      const response = await proposalSend.POST(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });
      const body = await readJson(response);

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
    });

    it("returns 404 for missing proposal", async () => {
      const { proposalSend } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals/999/send");
      const response = await proposalSend.POST(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("returns 400 for non-numeric ID", async () => {
      const { proposalSend } = await importHandlers();
      const request = makeRequest("POST", "http://localhost:3000/api/proposals/abc/send");
      const response = await proposalSend.POST(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(response.status).toBe(400);
    });

    it("creates a sent_email record", async () => {
      const proposal = createProposal(testDb, reservationId);

      const { proposalSend } = await importHandlers();
      const request = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposal.id}/send`,
      );
      await proposalSend.POST(request, {
        params: Promise.resolve({ id: String(proposal.id) }),
      });

      const emails = testDb
        .prepare("SELECT * FROM sent_emails WHERE proposal_id = ?")
        .all(proposal.id) as { to_email: string; body_preview: string }[];
      expect(emails).toHaveLength(1);
      expect(emails[0].to_email).toBe("test@example.com");
      expect(emails[0].body_preview).toContain("Test Villa");
    });
  });

  describe("full HTTP workflow", () => {
    it("complete lifecycle: create → send → approve → pay", async () => {
      const { reservations, proposalsList, proposalDetail, proposalSend } =
        await importHandlers();

      // 1. GET reservation
      const resResponse = await reservations.GET();
      const resBody = await readJson(resResponse);
      expect(resResponse.status).toBe(200);
      const resData = resBody.data as Record<string, unknown>;
      expect(resData.destination).toBe("Mexico");

      // 2. POST proposal
      const createRequest = makeRequest(
        "POST",
        "http://localhost:3000/api/proposals",
        { reservationId },
      );
      const createResponse = await proposalsList.POST(createRequest);
      const createBody = await readJson(createResponse);
      expect(createResponse.status).toBe(201);
      const proposalData = createBody.data as Record<string, unknown>;
      const proposalId = proposalData.id as number;
      expect(proposalData.status).toBe("draft");

      // 3. GET proposal detail
      const getReq = makeRequest(
        "GET",
        `http://localhost:3000/api/proposals/${proposalId}`,
      );
      const getResponse = await proposalDetail.GET(getReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const getBody = await readJson(getResponse);
      expect(getResponse.status).toBe(200);
      expect((getBody.data as Record<string, unknown>).total).toBe(0);

      // 4. POST send
      const sendReq = makeRequest(
        "POST",
        `http://localhost:3000/api/proposals/${proposalId}/send`,
      );
      const sendResponse = await proposalSend.POST(sendReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const sendBody = await readJson(sendResponse);
      expect(sendResponse.status).toBe(200);
      expect((sendBody.data as Record<string, unknown>).status).toBe("sent");

      // 5. PATCH approve
      const approveReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "approved" },
      );
      const approveResponse = await proposalDetail.PATCH(approveReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const approveBody = await readJson(approveResponse);
      expect(approveResponse.status).toBe(200);
      expect((approveBody.data as Record<string, unknown>).status).toBe("approved");

      // 6. PATCH pay
      const payReq = makeRequest(
        "PATCH",
        `http://localhost:3000/api/proposals/${proposalId}`,
        { status: "paid" },
      );
      const payResponse = await proposalDetail.PATCH(payReq, {
        params: Promise.resolve({ id: String(proposalId) }),
      });
      const payBody = await readJson(payResponse);
      expect(payResponse.status).toBe(200);
      expect((payBody.data as Record<string, unknown>).status).toBe("paid");

      // 7. Verify final state in database
      const row = testDb
        .prepare("SELECT status FROM proposals WHERE id = ?")
        .get(proposalId) as { status: string };
      expect(row.status).toBe("paid");

      // 8. Verify sent_email exists
      const emails = testDb
        .prepare("SELECT * FROM sent_emails WHERE proposal_id = ?")
        .all(proposalId) as unknown[];
      expect(emails).toHaveLength(1);
    });
  });
});

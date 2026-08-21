import { describe, it, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createSchema } from "@/lib/db/schema";
import { createMember } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";
import { createProposal, updateProposalStatus } from "@/lib/repositories/proposals";

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

describe("PATCH /api/proposals/[id]/notes", () => {
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
  });

  it("saves notes on a draft proposal", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "Looking forward to this trip!" },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: String(proposalId) }),
    });
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect((body.data as Record<string, unknown>).notes).toBe(
      "Looking forward to this trip!",
    );
  });

  it("overwrites existing notes", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );

    const firstReq = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "First note" },
    );
    await PATCH(firstReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    const secondReq = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "Updated note" },
    );
    const response = await PATCH(secondReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect((body.data as Record<string, unknown>).notes).toBe("Updated note");
  });

  it("clears notes with empty string", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );

    const setReq = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "Some note" },
    );
    await PATCH(setReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    const clearReq = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "" },
    );
    const response = await PATCH(clearReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect((body.data as Record<string, unknown>).notes).toBe("");
  });

  it("rejects notes on a sent proposal", async () => {
    updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());

    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "Should not work" },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    expect(response.status).toBe(409);
  });

  it("rejects notes on an approved proposal", async () => {
    updateProposalStatus(testDb, proposalId, "sent", new Date().toISOString());
    updateProposalStatus(testDb, proposalId, "approved");

    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "Should not work" },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    expect(response.status).toBe(409);
  });

  it("rejects notes exceeding 2000 characters", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "x".repeat(2001) },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    expect(response.status).toBe(400);
  });

  it("accepts notes at exactly 2000 characters", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "x".repeat(2000) },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    expect(response.status).toBe(200);
  });

  it("returns 404 for non-existent proposal", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      "http://localhost:3000/api/proposals/999/notes",
      { notes: "test" },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid proposal ID", async () => {
    const { PATCH } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const request = makeRequest(
      "PATCH",
      "http://localhost:3000/api/proposals/abc/notes",
      { notes: "test" },
    );
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
  });

  it("notes are visible in proposal detail GET", async () => {
    const { PATCH: PatchNotes } = await import(
      "@/app/api/proposals/[id]/notes/route"
    );
    const { GET } = await import(
      "@/app/api/proposals/[id]/route"
    );

    const patchReq = makeRequest(
      "PATCH",
      `http://localhost:3000/api/proposals/${proposalId}/notes`,
      { notes: "A personal note" },
    );
    await PatchNotes(patchReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });

    const getReq = makeRequest(
      "GET",
      `http://localhost:3000/api/proposals/${proposalId}`,
    );
    const response = await GET(getReq, {
      params: Promise.resolve({ id: String(proposalId) }),
    });
    const body = await readJson(response);
    const data = body.data as Record<string, unknown>;
    const proposal = data.proposal as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(proposal.notes).toBe("A personal note");
  });
});

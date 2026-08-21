import { getDatabase } from "@/lib/db";
import { createProposal, listProposals } from "@/lib/services/proposal";
import { reservationIdSchema } from "@/lib/validations";
import { ReservationNotFoundError } from "@/lib/errors";
import { proposalEvents } from "@/lib/events";

export async function GET() {
  try {
    const db = getDatabase();
    const proposals = listProposals(db);
    return Response.json({ success: true, data: proposals });
  } catch (error) {
    console.error("Unexpected error in GET /api/proposals:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const result = reservationIdSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const proposal = createProposal(db, result.data.reservationId);
    proposalEvents.emitChange();
    return Response.json({ success: true, data: proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error("Unexpected error in POST /api/proposals:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

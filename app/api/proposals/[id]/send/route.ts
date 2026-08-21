import { getDatabase } from "@/lib/db";
import { sendProposal } from "@/lib/services/proposal";
import { parseProposalId } from "@/lib/validations";
import {
  ProposalNotFoundError,
  InvalidProposalTransitionError,
} from "@/lib/errors";
import { proposalEvents } from "@/lib/events";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseProposalId(rawId);
    if (id === null) {
      return Response.json(
        { success: false, error: "Invalid proposal ID" },
        { status: 400 },
      );
    }

    const baseUrl = new URL(request.url).origin;
    const db = getDatabase();
    const proposal = sendProposal(db, id, baseUrl);

    proposalEvents.emitChange();
    return Response.json({ success: true, data: proposal });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    if (error instanceof InvalidProposalTransitionError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }
    console.error("Unexpected error in POST /api/proposals/[id]/send:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

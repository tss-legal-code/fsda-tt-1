import { getDatabase } from "@/lib/db";
import { getProposal, approveProposal, payProposal } from "@/lib/services/proposal";
import { parseProposalId, updateProposalStatusSchema } from "@/lib/validations";
import {
  ProposalNotFoundError,
  InvalidProposalTransitionError,
} from "@/lib/errors";
import { proposalEvents } from "@/lib/events";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseProposalId(rawId);
    if (id === null) {
      return Response.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    const db = getDatabase();
    const detail = getProposal(db, id);
    return Response.json({ success: true, data: detail });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error("Unexpected error in GET /api/proposals/[id]:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseProposalId(rawId);
    if (id === null) {
      return Response.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const result = updateProposalStatusSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();

    let proposal;
    if (result.data.status === "approved") {
      proposal = approveProposal(db, id);
    } else {
      proposal = payProposal(db, id);
    }

    proposalEvents.emitChange();
    return Response.json({ success: true, data: proposal });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidProposalTransitionError) {
      return Response.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Unexpected error in PATCH /api/proposals/[id]:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

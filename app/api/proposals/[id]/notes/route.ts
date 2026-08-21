import { getDatabase } from "@/lib/db";
import { updateNotes } from "@/lib/services/proposal";
import { parseProposalId, updateProposalNotesSchema } from "@/lib/validations";
import {
  ProposalNotFoundError,
  ProposalLockedError,
} from "@/lib/errors";
import { proposalEvents } from "@/lib/events";

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

    const result = updateProposalNotesSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const proposal = updateNotes(db, id, result.data.notes);
    proposalEvents.emitChange();
    return Response.json({ success: true, data: proposal });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ProposalLockedError) {
      return Response.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Unexpected error in PATCH /api/proposals/[id]/notes:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

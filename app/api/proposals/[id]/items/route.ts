import { getDatabase } from "@/lib/db";
import { addProposalItem } from "@/lib/services/proposal";
import { parseProposalId, createProposalItemSchema } from "@/lib/validations";
import {
  ProposalNotFoundError,
  ProposalLockedError,
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
      return Response.json({ success: false, error: "Invalid proposal ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const result = createProposalItemSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const { priceInCents, ...itemData } = result.data;
    const db = getDatabase();
    const item = addProposalItem(db, id, { ...itemData, price: priceInCents });
    proposalEvents.emitChange();
    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ProposalLockedError) {
      return Response.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Unexpected error in POST /api/proposals/[id]/items:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

import { getDatabase } from "@/lib/db";
import { updateProposalItem, removeProposalItem } from "@/lib/services/proposal";
import { parseProposalId, updateProposalItemSchema } from "@/lib/validations";
import {
  ProposalNotFoundError,
  ProposalLockedError,
} from "@/lib/errors";
import { proposalEvents } from "@/lib/events";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id: rawId, itemId: rawItemId } = await params;
    const id = parseProposalId(rawId);
    const itemId = parseProposalId(rawItemId);
    if (id === null || itemId === null) {
      return Response.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const result = updateProposalItemSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const { priceInCents, ...updates } = result.data;
    const db = getDatabase();
    updateProposalItem(db, id, itemId, {
      ...updates,
      ...(priceInCents !== undefined ? { price: priceInCents } : {}),
    });
    proposalEvents.emitChange();
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ProposalLockedError) {
      return Response.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Unexpected error in PATCH /api/proposals/[id]/items/[itemId]:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id: rawId, itemId: rawItemId } = await params;
    const id = parseProposalId(rawId);
    const itemId = parseProposalId(rawItemId);
    if (id === null || itemId === null) {
      return Response.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const db = getDatabase();
    removeProposalItem(db, id, itemId);
    proposalEvents.emitChange();
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ProposalNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ProposalLockedError) {
      return Response.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error("Unexpected error in DELETE /api/proposals/[id]/items/[itemId]:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

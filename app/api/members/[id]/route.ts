import { getDatabase } from "@/lib/db";
import { getMember, updateMember, removeMember } from "@/lib/services/member";
import { parseNumericId, updateMemberSchema } from "@/lib/validations";
import {
  MemberNotFoundError,
  MemberEmailConflictError,
} from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseNumericId(rawId);
    if (id === null) {
      return Response.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const member = getMember(db, id);
    return Response.json({ success: true, data: member });
  } catch (error) {
    if (error instanceof MemberNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    console.error("Unexpected error in GET /api/members/[id]:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseNumericId(rawId);
    if (id === null) {
      return Response.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const result = updateMemberSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const member = updateMember(db, id, result.data);
    return Response.json({ success: true, data: member });
  } catch (error) {
    if (error instanceof MemberNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    if (error instanceof MemberEmailConflictError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }
    console.error("Unexpected error in PATCH /api/members/[id]:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseNumericId(rawId);
    if (id === null) {
      return Response.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    removeMember(db, id);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof MemberNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("FOREIGN KEY constraint failed")
    ) {
      return Response.json(
        { success: false, error: "Cannot delete member with existing reservations" },
        { status: 409 },
      );
    }
    console.error("Unexpected error in DELETE /api/members/[id]:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

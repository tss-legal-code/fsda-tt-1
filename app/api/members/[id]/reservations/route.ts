import { getDatabase } from "@/lib/db";
import {
  listReservationsForMember,
  createReservation,
} from "@/lib/services/member";
import {
  parseNumericId,
  createReservationSchema,
} from "@/lib/validations";
import { MemberNotFoundError } from "@/lib/errors";

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
    const reservations = listReservationsForMember(db, id);
    return Response.json({ success: true, data: reservations });
  } catch (error) {
    if (error instanceof MemberNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    console.error(
      "Unexpected error in GET /api/members/[id]/reservations:",
      error,
    );
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
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

    const parsed = typeof body === "object" && body !== null ? body : {};
    const result = createReservationSchema.safeParse({ ...parsed, memberId: id });
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const reservation = createReservation(db, result.data);
    return Response.json({ success: true, data: reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    console.error(
      "Unexpected error in POST /api/members/[id]/reservations:",
      error,
    );
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

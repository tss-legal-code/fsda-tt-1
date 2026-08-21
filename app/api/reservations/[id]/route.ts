import { getDatabase } from "@/lib/db";
import {
  getReservation,
  updateReservation,
  removeReservation,
} from "@/lib/services/member";
import { parseNumericId, updateReservationSchema } from "@/lib/validations";
import { ReservationNotFoundError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseNumericId(rawId);
    if (id === null) {
      return Response.json(
        { success: false, error: "Invalid reservation ID" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const reservation = getReservation(db, id);
    return Response.json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    console.error("Unexpected error in GET /api/reservations/[id]:", error);
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
        { success: false, error: "Invalid reservation ID" },
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

    const result = updateReservationSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const reservation = updateReservation(db, id, result.data);
    return Response.json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    console.error("Unexpected error in PATCH /api/reservations/[id]:", error);
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
        { success: false, error: "Invalid reservation ID" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    removeReservation(db, id);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
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
        {
          success: false,
          error: "Cannot delete reservation with existing proposals",
        },
        { status: 409 },
      );
    }
    console.error("Unexpected error in DELETE /api/reservations/[id]:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { getDatabase } from "@/lib/db";
import { getReservation } from "@/lib/services/proposal";
import { ReservationNotFoundError } from "@/lib/errors";

export async function GET() {
  try {
    const db = getDatabase();
    const reservation = getReservation(db);
    return Response.json({ success: true, data: reservation });
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return Response.json({ success: false, error: error.message }, { status: 404 });
    }
    console.error("Unexpected error in GET /api/reservations:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

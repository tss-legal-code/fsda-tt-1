import { getDatabase } from "@/lib/db";
import { resetDatabase } from "@/lib/db/schema";
import { seedDevelopmentData } from "@/lib/seed";

export async function GET() {
  try {
    const db = getDatabase();
    resetDatabase(db);
    seedDevelopmentData(db);
    return Response.json({
      success: true,
      data: { message: "Database reset to initial state and seed" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/reset-db:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

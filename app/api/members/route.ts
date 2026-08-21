import { getDatabase } from "@/lib/db";
import { listMembers, createMember } from "@/lib/services/member";
import { createMemberSchema } from "@/lib/validations";
import { MemberEmailConflictError } from "@/lib/errors";

export async function GET() {
  try {
    const db = getDatabase();
    const members = listMembers(db);
    return Response.json({ success: true, data: members });
  } catch (error) {
    console.error("Unexpected error in GET /api/members:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const result = createMemberSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, error: `Invalid request body: ${result.error.message}` },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const member = createMember(db, result.data);
    return Response.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberEmailConflictError) {
      return Response.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }
    console.error("Unexpected error in POST /api/members:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

import type Database from "better-sqlite3";
import { createMember, getMemberByEmail } from "@/lib/repositories/members";
import { createReservation } from "@/lib/repositories/reservations";

export function seedDevelopmentData(db: Database.Database): void {
  const existingMember = getMemberByEmail(db, "james.whitfield@example.com");
  if (existingMember) return;

  const member = createMember(db, {
    name: "James Whitfield",
    email: "james.whitfield@example.com",
  });

  createReservation(db, {
    memberId: member.id,
    destination: "Mexico",
    villa: "Villa Punta Mita",
    arrivalDate: "2027-03-15",
    departureDate: "2027-03-22",
  });
}

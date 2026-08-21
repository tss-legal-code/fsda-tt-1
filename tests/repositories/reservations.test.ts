import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import { createMember } from "@/lib/repositories/members";
import {
  createReservation,
  getReservationById,
  getSeededReservation,
} from "@/lib/repositories/reservations";

describe("reservations repository", () => {
  let db: Database.Database;
  let memberId: number;

  beforeEach(() => {
    db = createTestDatabase();
    const member = createMember(db, {
      name: "Test Member",
      email: "test@example.com",
    });
    memberId = member.id;
  });

  it("creates and retrieves a reservation with member", () => {
    const reservation = createReservation(db, {
      memberId,
      destination: "Mexico",
      villa: "Villa Punta Mita",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    expect(reservation.id).toBeGreaterThan(0);
    expect(reservation.destination).toBe("Mexico");

    const found = getReservationById(db, reservation.id);
    expect(found).toBeDefined();
    expect(found?.destination).toBe("Mexico");
    expect(found?.villa).toBe("Villa Punta Mita");
    expect(found?.member.name).toBe("Test Member");
    expect(found?.member.email).toBe("test@example.com");
  });

  it("returns undefined for non-existent reservation", () => {
    expect(getReservationById(db, 999)).toBeUndefined();
  });

  it("getSeededReservation returns first reservation", () => {
    createReservation(db, {
      memberId,
      destination: "Mexico",
      villa: "Villa Punta Mita",
      arrivalDate: "2025-03-15",
      departureDate: "2025-03-22",
    });
    const seeded = getSeededReservation(db);
    expect(seeded).toBeDefined();
    expect(seeded?.destination).toBe("Mexico");
  });

  it("getSeededReservation returns undefined when empty", () => {
    expect(getSeededReservation(db)).toBeUndefined();
  });
});

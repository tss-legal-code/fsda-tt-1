import type Database from "better-sqlite3";
import type { Reservation, Member } from "@/lib/types";

interface ReservationRow {
  id: number;
  member_id: number;
  destination: string;
  villa: string;
  arrival_date: string;
  departure_date: string;
}

type ReservationWithMember = Reservation & { member: Member };

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    memberId: row.member_id,
    destination: row.destination,
    villa: row.villa,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
  };
}

export function getReservationById(
  db: Database.Database,
  id: number,
): ReservationWithMember | undefined {
  const row = db
    .prepare(
      `SELECT r.id, r.member_id, r.destination, r.villa, r.arrival_date, r.departure_date,
              m.id as m_id, m.name as m_name, m.email as m_email
       FROM reservations r
       JOIN members m ON m.id = r.member_id
       WHERE r.id = ?`,
    )
    .get(id) as
      | (ReservationRow & { m_id: number; m_name: string; m_email: string })
      | undefined;
  if (!row) return undefined;
  return {
    ...toReservation(row),
    member: { id: row.m_id, name: row.m_name, email: row.m_email },
  };
}

export function getSeededReservation(
  db: Database.Database,
): ReservationWithMember | undefined {
  const row = db
    .prepare(
      `SELECT r.id, r.member_id, r.destination, r.villa, r.arrival_date, r.departure_date,
              m.id as m_id, m.name as m_name, m.email as m_email
       FROM reservations r
       JOIN members m ON m.id = r.member_id
       LIMIT 1`,
    )
    .get() as
      | (ReservationRow & { m_id: number; m_name: string; m_email: string })
      | undefined;
  if (!row) return undefined;
  return {
    ...toReservation(row),
    member: { id: row.m_id, name: row.m_name, email: row.m_email },
  };
}

export function createReservation(
  db: Database.Database,
  data: {
    memberId: number;
    destination: string;
    villa: string;
    arrivalDate: string;
    departureDate: string;
  },
): Reservation {
  const result = db
    .prepare(
      "INSERT INTO reservations (member_id, destination, villa, arrival_date, departure_date) VALUES (?, ?, ?, ?, ?)",
    )
    .run(data.memberId, data.destination, data.villa, data.arrivalDate, data.departureDate);
  return {
    id: Number(result.lastInsertRowid),
    memberId: data.memberId,
    destination: data.destination,
    villa: data.villa,
    arrivalDate: data.arrivalDate,
    departureDate: data.departureDate,
  };
}

export function listReservationsForMember(
  db: Database.Database,
  memberId: number,
): Reservation[] {
  const rows = db
    .prepare(
      "SELECT id, member_id, destination, villa, arrival_date, departure_date FROM reservations WHERE member_id = ? ORDER BY arrival_date",
    )
    .all(memberId) as ReservationRow[];
  return rows.map(toReservation);
}

export function updateReservation(
  db: Database.Database,
  id: number,
  data: {
    destination: string;
    villa: string;
    arrivalDate: string;
    departureDate: string;
  },
): void {
  db.prepare(
    "UPDATE reservations SET destination = ?, villa = ?, arrival_date = ?, departure_date = ? WHERE id = ?",
  ).run(data.destination, data.villa, data.arrivalDate, data.departureDate, id);
}

export function deleteReservation(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM reservations WHERE id = ?").run(id);
}

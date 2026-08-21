import type Database from "better-sqlite3";
import type { Proposal, Reservation, Member, ProposalStatus } from "@/lib/types";

interface ProposalRow {
  id: number;
  reservation_id: number;
  status: ProposalStatus;
  notes: string;
  created_at: string;
  sent_at: string | null;
}

type ProposalWithReservation = Proposal & {
  reservation: Reservation & { member: Member };
};

function toProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
}

export function createProposal(
  db: Database.Database,
  reservationId: number,
): Proposal {
  const result = db
    .prepare("INSERT INTO proposals (reservation_id) VALUES (?)")
    .run(reservationId);
  return {
    id: Number(result.lastInsertRowid),
    reservationId,
    status: "draft",
    notes: "",
    createdAt: new Date().toISOString(),
    sentAt: null,
  };
}

export function getProposalById(
  db: Database.Database,
  id: number,
): Proposal | undefined {
  const row = db
    .prepare("SELECT id, reservation_id, status, notes, created_at, sent_at FROM proposals WHERE id = ?")
    .get(id) as ProposalRow | undefined;
  return row ? toProposal(row) : undefined;
}

interface ListProposalRow {
  id: number;
  reservation_id: number;
  status: ProposalStatus;
  notes: string;
  created_at: string;
  sent_at: string | null;
  r_id: number;
  member_id: number;
  destination: string;
  villa: string;
  arrival_date: string;
  departure_date: string;
  m_id: number;
  m_name: string;
  m_email: string;
}

export function listProposals(
  db: Database.Database,
): ProposalWithReservation[] {
  const rows = db
    .prepare(
      `SELECT p.id, p.reservation_id, p.status, p.notes, p.created_at, p.sent_at,
              r.id as r_id, r.member_id, r.destination, r.villa, r.arrival_date, r.departure_date,
              m.id as m_id, m.name as m_name, m.email as m_email
       FROM proposals p
       JOIN reservations r ON r.id = p.reservation_id
       JOIN members m ON m.id = r.member_id
       ORDER BY p.created_at DESC`,
    )
    .all() as ListProposalRow[];

  return rows.map((row) => ({
    ...toProposal(row),
    reservation: {
      id: row.r_id,
      memberId: row.member_id,
      destination: row.destination,
      villa: row.villa,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      member: { id: row.m_id, name: row.m_name, email: row.m_email },
    },
  }));
}

export function updateProposalStatus(
  db: Database.Database,
  id: number,
  status: ProposalStatus,
  sentAt?: string,
): void {
  if (sentAt !== undefined) {
    db.prepare("UPDATE proposals SET status = ?, sent_at = ? WHERE id = ?")
      .run(status, sentAt, id);
  } else {
    db.prepare("UPDATE proposals SET status = ? WHERE id = ?").run(status, id);
  }
}

export function updateProposalNotes(
  db: Database.Database,
  id: number,
  notes: string,
): void {
  db.prepare("UPDATE proposals SET notes = ? WHERE id = ?").run(notes, id);
}

import type Database from "better-sqlite3";
import type { Member, Reservation } from "@/lib/types";
import {
  listMembers as repoListMembers,
  getMemberById as repoGetMemberById,
  getMemberByEmail,
  createMember as repoCreateMember,
  updateMember as repoUpdateMember,
  deleteMember as repoDeleteMember,
} from "@/lib/repositories/members";
import {
  listReservationsForMember as repoListReservationsForMember,
  getReservationById,
  createReservation as repoCreateReservation,
  updateReservation as repoUpdateReservation,
  deleteReservation as repoDeleteReservation,
} from "@/lib/repositories/reservations";
import {
  MemberNotFoundError,
  MemberEmailConflictError,
  ReservationNotFoundError,
} from "@/lib/errors";

export function listMembers(db: Database.Database): Member[] {
  return repoListMembers(db);
}

export function getMember(db: Database.Database, id: number): Member {
  const member = repoGetMemberById(db, id);
  if (!member) {
    throw new MemberNotFoundError(`Member ${id} not found`);
  }
  return member;
}

export function createMember(
  db: Database.Database,
  data: { name: string; email: string },
): Member {
  const existing = getMemberByEmail(db, data.email);
  if (existing) {
    throw new MemberEmailConflictError(data.email);
  }
  return repoCreateMember(db, data);
}

export function updateMember(
  db: Database.Database,
  id: number,
  data: { name: string; email: string },
): Member {
  const member = repoGetMemberById(db, id);
  if (!member) {
    throw new MemberNotFoundError(`Member ${id} not found`);
  }
  if (data.email !== member.email) {
    const existing = getMemberByEmail(db, data.email);
    if (existing) {
      throw new MemberEmailConflictError(data.email);
    }
  }
  repoUpdateMember(db, id, data);
  return { ...member, ...data };
}

export function removeMember(db: Database.Database, id: number): void {
  const member = repoGetMemberById(db, id);
  if (!member) {
    throw new MemberNotFoundError(`Member ${id} not found`);
  }
  repoDeleteMember(db, id);
}

export function listReservationsForMember(
  db: Database.Database,
  memberId: number,
): Reservation[] {
  const member = repoGetMemberById(db, memberId);
  if (!member) {
    throw new MemberNotFoundError(`Member ${memberId} not found`);
  }
  return repoListReservationsForMember(db, memberId);
}

export function getReservation(
  db: Database.Database,
  reservationId: number,
): Reservation {
  const reservation = getReservationById(db, reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError(`Reservation ${reservationId} not found`);
  }
  return reservation;
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
  const member = repoGetMemberById(db, data.memberId);
  if (!member) {
    throw new MemberNotFoundError(`Member ${data.memberId} not found`);
  }
  return repoCreateReservation(db, data);
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
): Reservation {
  const existing = getReservationById(db, id);
  if (!existing) {
    throw new ReservationNotFoundError(`Reservation ${id} not found`);
  }
  repoUpdateReservation(db, id, data);
  return { ...existing, ...data };
}

export function removeReservation(db: Database.Database, id: number): void {
  const existing = getReservationById(db, id);
  if (!existing) {
    throw new ReservationNotFoundError(`Reservation ${id} not found`);
  }
  repoDeleteReservation(db, id);
}

import type Database from "better-sqlite3";
import type {
  Proposal,
  ProposalItem,
  ProposalDetail,
  ProposalSummary,
  ItineraryCategory,
} from "@/lib/types";
import {
  canTransitionProposalStatus,
  calculateProposalTotal,
} from "@/lib/domain/proposal";
import { getReservationById } from "@/lib/repositories/reservations";
import {
  createProposal as repoCreateProposal,
  getProposalById as repoGetProposalById,
  listProposals as repoListProposals,
  updateProposalStatus,
  updateProposalNotes,
} from "@/lib/repositories/proposals";
import {
  createProposalItem as repoCreateProposalItem,
  getProposalItemsByProposalId,
  updateProposalItem as repoUpdateProposalItem,
  deleteProposalItem as repoDeleteProposalItem,
} from "@/lib/repositories/proposal-items";
import { createSentEmail } from "@/lib/repositories/sent-emails";
import {
  ReservationNotFoundError,
  ProposalNotFoundError,
  InvalidProposalTransitionError,
  ProposalLockedError,
} from "@/lib/errors";

function getProposalOrThrow(
  db: Database.Database,
  proposalId: number,
): Proposal {
  const proposal = repoGetProposalById(db, proposalId);
  if (!proposal) {
    throw new ProposalNotFoundError(`Proposal ${proposalId} not found`);
  }
  return proposal;
}

function assertProposalIsDraft(proposal: Proposal): void {
  if (proposal.status !== "draft") {
    throw new ProposalLockedError(
      `Cannot modify items of a proposal in "${proposal.status}" state`,
    );
  }
}

export function getReservation(db: Database.Database) {
  const reservation = getReservationById(db, 1);
  if (!reservation) {
    throw new ReservationNotFoundError("No reservation found");
  }
  return reservation;
}

export function createProposal(
  db: Database.Database,
  reservationId: number,
): Proposal {
  const reservation = getReservationById(db, reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError(
      `Reservation ${reservationId} not found`,
    );
  }
  return repoCreateProposal(db, reservationId);
}

export function addProposalItem(
  db: Database.Database,
  proposalId: number,
  data: {
    category: ItineraryCategory;
    title: string;
    description: string;
    scheduledAt: string;
    price: number;
  },
): ProposalItem {
  const proposal = getProposalOrThrow(db, proposalId);
  assertProposalIsDraft(proposal);
  return repoCreateProposalItem(db, { proposalId, ...data });
}

export function updateProposalItem(
  db: Database.Database,
  proposalId: number,
  itemId: number,
  updates: Partial<
    Pick<
      ProposalItem,
      "category" | "title" | "description" | "scheduledAt" | "price"
    >
  >,
): void {
  const proposal = getProposalOrThrow(db, proposalId);
  assertProposalIsDraft(proposal);
  repoUpdateProposalItem(db, itemId, updates);
}

export function removeProposalItem(
  db: Database.Database,
  proposalId: number,
  itemId: number,
): void {
  const proposal = getProposalOrThrow(db, proposalId);
  assertProposalIsDraft(proposal);
  repoDeleteProposalItem(db, itemId);
}

export function getProposal(
  db: Database.Database,
  proposalId: number,
): ProposalDetail {
  const proposal = getProposalOrThrow(db, proposalId);
  const reservation = getReservationById(db, proposal.reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError(
      `Reservation ${proposal.reservationId} not found`,
    );
  }
  const items = getProposalItemsByProposalId(db, proposalId);
  const total = calculateProposalTotal(items);
  return { proposal, reservation, items, total };
}

export function listProposals(db: Database.Database): ProposalSummary[] {
  const proposals = repoListProposals(db);
  return proposals.map((p) => {
    const items = getProposalItemsByProposalId(db, p.id);
    const total = calculateProposalTotal(items);
    return {
      proposal: {
        id: p.id,
        reservationId: p.reservationId,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        sentAt: p.sentAt,
      },
      reservation: p.reservation,
      total,
    };
  });
}

export function sendProposal(
  db: Database.Database,
  proposalId: number,
  baseUrl: string,
): Proposal {
  const proposal = getProposalOrThrow(db, proposalId);

  if (!canTransitionProposalStatus(proposal.status, "sent")) {
    throw new InvalidProposalTransitionError(proposal.status, "sent");
  }

  const reservation = getReservationById(db, proposal.reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError(
      `Reservation ${proposal.reservationId} not found`,
    );
  }

  const sentAt = new Date().toISOString();
  const proposalUrl = `${baseUrl}/proposal/${proposal.id}`;
  const bodyPreview = `Your curated itinerary for ${reservation.villa}, ${reservation.destination} is ready for review. View it at: ${proposalUrl}`;

  console.log("TERMINAL proposal sent:", bodyPreview);

  const sendTransaction = db.transaction(() => {
    updateProposalStatus(db, proposalId, "sent", sentAt);
    createSentEmail(db, {
      proposalId,
      toEmail: reservation.member.email,
      sentAt,
      bodyPreview,
    });
  });

  sendTransaction();

  return repoGetProposalById(db, proposalId)!;
}

export function approveProposal(
  db: Database.Database,
  proposalId: number,
): Proposal {
  const proposal = getProposalOrThrow(db, proposalId);

  if (!canTransitionProposalStatus(proposal.status, "approved")) {
    throw new InvalidProposalTransitionError(proposal.status, "approved");
  }

  updateProposalStatus(db, proposalId, "approved");
  return repoGetProposalById(db, proposalId)!;
}

export function payProposal(
  db: Database.Database,
  proposalId: number,
): Proposal {
  const proposal = getProposalOrThrow(db, proposalId);

  if (!canTransitionProposalStatus(proposal.status, "paid")) {
    throw new InvalidProposalTransitionError(proposal.status, "paid");
  }

  updateProposalStatus(db, proposalId, "paid");
  return repoGetProposalById(db, proposalId)!;
}

export function updateNotes(
  db: Database.Database,
  proposalId: number,
  notes: string,
): Proposal {
  const proposal = getProposalOrThrow(db, proposalId);
  if (proposal.status !== "draft") {
    throw new ProposalLockedError(
      `Cannot edit notes of a proposal in "${proposal.status}" state`,
    );
  }
  updateProposalNotes(db, proposalId, notes);
  return repoGetProposalById(db, proposalId)!;
}

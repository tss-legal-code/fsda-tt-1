"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Reservation, Member, ProposalSummary, ProposalDetail } from "@/lib/types";
import MemberList from "./MemberList";
import ReservationList from "./ReservationList";
import MemberHeader from "./MemberHeader";
import TripHeader from "./TripHeader";
import DashboardClient from "./DashboardClient";

type View = "members" | "reservations" | "dashboard";

export default function RootClient() {
  const [view, setView] = useState<View>("members");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation & { member: Member } | null>(null);
  const [initialProposals, setInitialProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectMember(member: Member) {
    if (selectedMemberId === member.id) {
      setSelectedMemberId(null);
      setSelectedMember(null);
      setView("members");
      return;
    }
    setSelectedMemberId(member.id);
    setSelectedMember(member);
    setSelectedReservation(null);
    setView("reservations");
  }

  async function handleSelectReservation(reservation: Reservation) {
    setLoading(true);
    setError(null);
    try {
      const [proposalsRes, reservationDetailRes] = await Promise.all([
        fetch("/api/proposals"),
        fetch(`/api/reservations/${reservation.id}`),
      ]);
      let filtered: ProposalSummary[] = [];
      if (proposalsRes.ok) {
        const body = await proposalsRes.json();
        const allProposals = body.data as ProposalSummary[];
        filtered = allProposals.filter(
          (p) => p.reservation.id === reservation.id,
        );
      }
      setInitialProposals(filtered);
      if (reservationDetailRes.ok) {
        const body = await reservationDetailRes.json();
        setSelectedReservation(body.data);
      } else {
        setSelectedReservation({ ...reservation, member: { id: 0, name: "", email: "" } });
      }
      setView("dashboard");
    } catch {
      setError("Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToMembers() {
    setSelectedMemberId(null);
    setSelectedMember(null);
    setSelectedReservation(null);
    setView("members");
  }

  function handleBackToReservations() {
    setSelectedReservation(null);
    setView("reservations");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Concierge
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-muted">Loading...</div>
      )}

      {!loading && view === "members" && (
        <MemberList
          onSelectMember={handleSelectMember}
          selectedMemberId={selectedMemberId}
        />
      )}

      {!loading && view === "reservations" && selectedMemberId && (
        <div className="space-y-6">
          <button
            onClick={handleBackToMembers}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            &lt; Back to Members
          </button>
          {selectedMember && <MemberHeader member={selectedMember} />}
          <ReservationList
            memberId={selectedMemberId}
            onSelectReservation={handleSelectReservation}
          />
        </div>
      )}

      {!loading && view === "dashboard" && selectedReservation && (
        <div className="space-y-6">
          <button
            onClick={handleBackToReservations}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            &lt; Back to Reservations
          </button>
          <TripHeader reservation={selectedReservation} />
          <DashboardClient
            initialProposals={initialProposals}
            reservationId={selectedReservation.id}
            arrivalDate={selectedReservation.arrivalDate}
          />
        </div>
      )}
    </div>
  );
}

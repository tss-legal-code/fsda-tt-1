"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reservation } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";
import EntityModal from "./EntityModal";
import type { ModalField } from "./EntityModal";

const RESERVATION_FIELDS: ModalField[] = [
  { name: "destination", label: "Destination", type: "text" },
  { name: "villa", label: "Villa", type: "text" },
  { name: "arrivalDate", label: "Arrival Date", type: "date" },
  { name: "departureDate", label: "Departure Date", type: "date" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReservationList({
  memberId,
  onSelectReservation,
}: {
  memberId: number;
  onSelectReservation: (reservation: Reservation) => void;
}) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/reservations`);
      if (res.ok) {
        const body = await res.json();
        setReservations(body.data);
      }
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  async function handleCreate(data: Record<string, string>) {
    const res = await fetch(`/api/members/${memberId}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to create reservation");
    }
    await fetchReservations();
  }

  async function handleUpdate(data: Record<string, string>) {
    if (!editingReservation) return;
    const res = await fetch(`/api/reservations/${editingReservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to update reservation");
    }
    await fetchReservations();
  }

  async function handleDelete(reservation: Reservation) {
    if (
      !confirm(
        `Delete reservation at ${reservation.villa}? This will also delete all associated proposals.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/reservations/${reservation.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to delete reservation");
      return;
    }
    await fetchReservations();
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Loading reservations...
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium text-foreground">Reservations</h2>
        <button
          onClick={() => {
            setEditingReservation(null);
            setModalOpen(true);
          }}
          className="rounded bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Add Reservation
        </button>
      </div>

      {error && (
        <div className="border-b border-border bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">
          No reservations yet. Add a reservation to start building proposals.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <div className="flex w-full items-center justify-between px-6 py-3 text-left text-sm transition-colors hover:bg-surface/50">
                <button
                  onClick={() => onSelectReservation(reservation)}
                  className="flex flex-1 items-center gap-4"
                >
                  <span className="font-mono text-xs text-muted">
                    #{reservation.id}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      {reservation.villa}
                    </p>
                    <p className="text-xs text-muted">
                      {reservation.destination} ·{" "}
                      {formatDate(reservation.arrivalDate)} —{" "}
                      {formatDate(reservation.departureDate)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingReservation(reservation);
                      setModalOpen(true);
                    }}
                    className="rounded p-1.5 text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                    aria-label={`Edit reservation at ${reservation.villa}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(reservation);
                    }}
                    className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600"
                    aria-label={`Delete reservation at ${reservation.villa}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <EntityModal
          title={
            editingReservation ? "Edit Reservation" : "Add Reservation"
          }
          fields={RESERVATION_FIELDS}
          initialValues={
            editingReservation
              ? {
                  destination: editingReservation.destination,
                  villa: editingReservation.villa,
                  arrivalDate: editingReservation.arrivalDate,
                  departureDate: editingReservation.departureDate,
                }
              : { destination: "", villa: "", arrivalDate: "", departureDate: "" }
          }
          onSubmit={editingReservation ? handleUpdate : handleCreate}
          onClose={() => {
            setModalOpen(false);
            setEditingReservation(null);
          }}
        />
      )}
    </section>
  );
}

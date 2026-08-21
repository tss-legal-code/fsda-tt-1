import type { Reservation, Member } from "@/lib/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TripHeader({
  reservation,
}: {
  reservation: Reservation & { member: Member };
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Active Reservation
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {reservation.member.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {reservation.villa} · {reservation.destination}
      </p>
      <p className="mt-1 text-sm text-muted">
        {formatDate(reservation.arrivalDate)} — {formatDate(reservation.departureDate)}
      </p>
    </section>
  );
}

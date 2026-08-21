function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function countNights(arrival: string, departure: string): number {
  const a = new Date(arrival);
  const d = new Date(departure);
  return Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProposalSummary({
  itemCount,
  total,
  arrivalDate,
  departureDate,
}: {
  itemCount: number;
  total: number;
  arrivalDate: string;
  departureDate: string;
}) {
  const nights = countNights(arrivalDate, departureDate);

  return (
    <section className="text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {itemCount} {itemCount === 1 ? "experience" : "experiences"} ·{" "}
        {nights} {nights === 1 ? "night" : "nights"}
      </p>
      <p className="mt-3 font-serif text-3xl font-medium text-foreground sm:text-4xl">
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">
        Total itinerary
      </p>
    </section>
  );
}

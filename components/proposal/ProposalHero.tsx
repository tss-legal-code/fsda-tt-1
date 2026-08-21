function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function formatYear(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
  });
}

export default function ProposalHero({
  memberName,
  destination,
  villa,
  arrivalDate,
  departureDate,
}: {
  memberName: string;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
}) {
  return (
    <header className="text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {destination}, {villa}
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
        Itinerary Proposal
      </h1>
        <p className="text-xl text-foreground font-sans">for {memberName}</p>
      <div className="mt-6 space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted">
          {formatDate(arrivalDate)} — {formatDate(departureDate)},{" "}
          {formatYear(arrivalDate)}
        </p>
      </div>
    </header>
  );
}

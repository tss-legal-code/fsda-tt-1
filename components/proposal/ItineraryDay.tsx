import type { ProposalItem } from "@/lib/types";
import ItineraryItem from "./ItineraryItem";

function formatDayHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ItineraryDay({
  date,
  items,
}: {
  date: string;
  items: ProposalItem[];
}) {
  return (
    <section>
      <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-muted">
        {formatDayHeading(date)}
      </h3>
      <div className="space-y-0">
        {items.map((item, index) => (
          <ItineraryItem key={item.id} item={item} isLast={index === items.length - 1} />
        ))}
      </div>
    </section>
  );
}

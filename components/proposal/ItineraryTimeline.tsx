import type { ProposalItem } from "@/lib/types";
import { getLocalDateKey } from "@/lib/timezone";
import ItineraryDay from "./ItineraryDay";

function groupByDate(items: ProposalItem[]): Map<string, ProposalItem[]> {
  const groups = new Map<string, ProposalItem[]>();
  for (const item of items) {
    const dateKey = getLocalDateKey(item.scheduledAt);
    const existing = groups.get(dateKey) ?? [];
    existing.push(item);
    groups.set(dateKey, existing);
  }
  return groups;
}

export default function ItineraryTimeline({
  items,
}: {
  items: ProposalItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Your itinerary is being prepared.
      </p>
    );
  }

  const groups = groupByDate(items);

  return (
    <section>
      <h2 className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Your Curated Experience
      </h2>
      <div className="space-y-10">
        {Array.from(groups.entries()).map(([dateKey, dayItems]) => (
          <ItineraryDay key={dateKey} date={dateKey} items={dayItems} />
        ))}
      </div>
    </section>
  );
}

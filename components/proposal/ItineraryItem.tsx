import type { ProposalItem, ItineraryCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(cents: number): string {
  if (cents === 0) return "Complimentary";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function ItineraryItem({
  item,
  isLast,
}: {
  item: ProposalItem;
  isLast: boolean;
}) {
  return (
    <div className={`py-5 ${!isLast ? "border-b border-border" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {formatTime(item.scheduledAt)}{" "}
            <span className="text-muted/50">·</span>{" "}
            {CATEGORY_LABELS[item.category as ItineraryCategory]}
          </p>
          <h4 className="mt-1 text-base font-medium text-foreground">
            {item.title}
          </h4>
          {item.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {item.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted">
          {formatCurrency(item.price)}
        </span>
      </div>
    </div>
  );
}

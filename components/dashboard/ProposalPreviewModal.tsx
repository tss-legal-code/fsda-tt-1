"use client";

import type { ProposalDetail } from "@/lib/types";
import { getLocalDateKey } from "@/lib/timezone";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDate(
  items: ProposalDetail["items"],
): Map<string, ProposalDetail["items"]> {
  const groups = new Map<string, ProposalDetail["items"]>();
  for (const item of items) {
    const key = getLocalDateKey(item.scheduledAt);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }
  return groups;
}

export default function ProposalPreviewModal({
  detail,
  open,
  onClose,
}: {
  detail: ProposalDetail;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const groups = groupByDate(detail.items);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Proposal preview"
    >
      <div
        className="mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-border bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Proposal Preview
            </h2>
            <button
              onClick={onClose}
              className="rounded px-2 py-1 text-xs text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs text-muted">Prepared for</p>
          <p className="text-sm font-medium text-foreground">
            {detail.reservation.member.name}
          </p>
          <p className="text-xs text-muted">
            {detail.reservation.villa} · {detail.reservation.destination}
          </p>
          <p className="text-xs text-muted">
            {formatDate(detail.reservation.arrivalDate)} —{" "}
            {formatDate(detail.reservation.departureDate)}
          </p>
        </div>

        {detail.proposal.notes && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Your Note
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {detail.proposal.notes}
            </p>
          </div>
        )}

        <div className="border-t border-border px-6 py-4">
          {detail.items.length === 0 ? (
            <p className="text-center text-sm text-muted">
              No items in this proposal.
            </p>
          ) : (
            <div className="space-y-4">
              {Array.from(groups.entries()).map(([dateKey, dateItems]) => (
                <div key={dateKey}>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    {formatDate(dateKey)}
                  </h3>
                  <ul className="space-y-1.5">
                    {dateItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between text-sm"
                      >
                        <div>
                          <span className="text-muted text-xs">
                            {formatTime(item.scheduledAt)}
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {item.title}
                          </span>
                          {item.description && (
                            <p className="text-xs text-muted">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="ml-3 font-mono text-xs tabular-nums text-muted">
                          {formatCurrency(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Estimated Total
            </span>
            <span className="font-mono text-sm font-medium tabular-nums text-foreground">
              {formatCurrency(detail.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

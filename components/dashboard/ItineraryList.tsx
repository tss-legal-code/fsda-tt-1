"use client";

import React from "react";
import type { ProposalItem } from "@/lib/types";
import { CATEGORY_LABELS, type ItineraryCategory } from "@/lib/types";
import { getLocalDateKey } from "@/lib/timezone";
import ItemEditorInline from "./ItemEditorInline";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + " · " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

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

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ItineraryList({
  items,
  total,
  isDraft,
  onUpdate,
  onRemove,
}: {
  items: ProposalItem[];
  total: number;
  isDraft: boolean;
  onUpdate: (
    itemId: number,
    data: {
      category?: ItineraryCategory;
      title?: string;
      description?: string;
      scheduledAt?: string;
      priceInCents?: number;
    },
  ) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted">
          No items added yet. Use the builder to start building the itinerary.
        </p>
      </div>
    );
  }

  const groups = groupByDate(items);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([dateKey, dateItems]) => (
          <div key={dateKey}>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {formatDateHeading(dateKey)}
            </h3>
            <ul className="space-y-1">
              {dateItems.map((item) => (
                <ItineraryItemRow
                  key={item.id}
                  item={item}
                  isDraft={isDraft}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Estimated Total
          </span>
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ItineraryItemRow({
  item,
  isDraft,
  onUpdate,
  onRemove,
}: {
  item: ProposalItem;
  isDraft: boolean;
  onUpdate: (
    itemId: number,
    data: {
      category?: ItineraryCategory;
      title?: string;
      description?: string;
      scheduledAt?: string;
      priceInCents?: number;
    },
  ) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  async function handleRemove() {
    setRemoving(true);
    try {
      await onRemove(item.id);
    } catch {
      setRemoving(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded border border-accent/30 bg-accent/5 p-3">
        <ItemEditorInline
          item={item}
          onSave={async (data) => {
            await onUpdate(item.id, data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between rounded border border-border bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {CATEGORY_LABELS[item.category as ItineraryCategory]}
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="text-sm font-medium text-foreground">
            {item.title}
          </span>
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-muted">{item.description}</p>
        )}
        <p className="mt-0.5 text-xs text-muted">
          {formatDateTime(item.scheduledAt)}
        </p>
      </div>
      <div className="ml-3 flex items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-foreground">
          {formatCurrency(item.price)}
        </span>
        {isDraft && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
            >
              Edit
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600 disabled:opacity-50"
            >
              {removing ? "..." : "Remove"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

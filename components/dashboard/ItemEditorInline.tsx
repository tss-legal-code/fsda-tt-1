"use client";

import { useState } from "react";
import type { ProposalItem } from "@/lib/types";
import {
  ITINERARY_ITEMS,
  CATEGORY_LABELS,
  type ItineraryCategory,
} from "@/lib/types";
import { buildLocalDate, toLocalDateTime } from "@/lib/timezone";

const CATEGORIES = Object.keys(ITINERARY_ITEMS) as ItineraryCategory[];

export default function ItemEditorInline({
  item,
  onSave,
  onCancel,
}: {
  item: ProposalItem;
  onSave: (data: {
    category?: ItineraryCategory;
    title?: string;
    description?: string;
    scheduledAt?: string;
    priceInCents?: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<ItineraryCategory>(
    item.category as ItineraryCategory,
  );
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const { date: initDate, time: initTime } = toLocalDateTime(item.scheduledAt);
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initTime);
  const [priceDollars, setPriceDollars] = useState(
    (item.price / 100).toFixed(2),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(newCat: ItineraryCategory) {
    setCategory(newCat);
    if (!ITINERARY_ITEMS[newCat].includes(title)) {
      setTitle(ITINERARY_ITEMS[newCat][0]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(priceDollars);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid price.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        category,
        title,
        description,
        scheduledAt: buildLocalDate(date, time).toISOString(),
        priceInCents: Math.round(priceNum * 100),
      });
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  const titles = ITINERARY_ITEMS[category];

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor={`edit-category-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Category
          </label>
          <select
            id={`edit-category-${item.id}`}
            value={category}
            onChange={(e) =>
              handleCategoryChange(e.target.value as ItineraryCategory)
            }
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`edit-title-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Experience
          </label>
          <select
            id={`edit-title-${item.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          >
            {titles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor={`edit-date-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Date
          </label>
          <input
            id={`edit-date-${item.id}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          />
        </div>
        <div>
          <label
            htmlFor={`edit-time-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Time
          </label>
          <input
            id={`edit-time-${item.id}`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor={`edit-desc-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Description
          </label>
          <input
            id={`edit-desc-${item.id}`}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          />
        </div>
        <div>
          <label
            htmlFor={`edit-price-${item.id}`}
            className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            Price ($)
          </label>
          <input
            id={`edit-price-${item.id}`}
            type="number"
            step="0.01"
            min="0"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs tabular-nums text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

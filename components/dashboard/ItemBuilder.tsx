"use client";

import { useState } from "react";
import {
  ITINERARY_ITEMS,
  CATEGORY_LABELS,
  type ItineraryCategory,
} from "@/lib/types";
import { buildLocalDate } from "@/lib/timezone";

const CATEGORIES = Object.keys(ITINERARY_ITEMS) as ItineraryCategory[];

export default function ItemBuilder({
  onAdd,
  arrivalDate,
  disabled,
}: {
  onAdd: (data: {
    category: ItineraryCategory;
    title: string;
    description: string;
    scheduledAt: string;
    priceInCents: number;
  }) => Promise<void>;
  arrivalDate: string;
  disabled: boolean;
}) {
  const [category, setCategory] = useState<ItineraryCategory>("dining");
  const [title, setTitle] = useState(ITINERARY_ITEMS.dining[0]);
  const [date, setDate] = useState(arrivalDate);
  const [time, setTime] = useState("19:00");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(newCategory: ItineraryCategory) {
    setCategory(newCategory);
    setTitle(ITINERARY_ITEMS[newCategory][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(priceDollars);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({
        category,
        title,
        description,
        scheduledAt: buildLocalDate(date, time).toISOString(),
        priceInCents: Math.round(priceNum * 100),
      });
      setDescription("");
      setPriceDollars("");
      setError(null);
    } catch {
      setError("Failed to add item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const titles = ITINERARY_ITEMS[category];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="item-category"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Category
          </label>
          <select
            id="item-category"
            value={category}
            onChange={(e) =>
              handleCategoryChange(e.target.value as ItineraryCategory)
            }
            disabled={disabled || submitting}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
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
            htmlFor="item-title"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Experience
          </label>
          <select
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled || submitting}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
          >
            {titles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="item-date"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Date
          </label>
          <input
            id="item-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={disabled || submitting}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="item-time"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
          >
            Time
          </label>
          <input
            id="item-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={disabled || submitting}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="item-description"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
        >
          Description
        </label>
        <input
          id="item-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          disabled={disabled || submitting}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="item-price"
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted"
        >
          Estimated Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            $
          </span>
          <input
            id="item-price"
            type="number"
            step="0.01"
            min="0"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            placeholder="0.00"
            disabled={disabled || submitting}
            className="w-full rounded border border-border bg-white py-2 pl-7 pr-3 text-sm tabular-nums text-foreground placeholder:text-muted/50 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full rounded bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add to Itinerary"}
      </button>
    </form>
  );
}

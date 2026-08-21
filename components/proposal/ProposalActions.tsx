"use client";

import { useState } from "react";
import type { ProposalStatus } from "@/lib/types";
import ConfirmationView from "./ConfirmationView";

export default function ProposalActions({
  proposalId,
  status: initialStatus,
  destination,
  villa,
}: {
  proposalId: number;
  status: ProposalStatus;
  destination: string;
  villa: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(nextStatus: "approved" | "paid") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json();
        if (res.status === 409) {
          const detailRes = await fetch(`/api/proposals/${proposalId}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setStatus(detail.data.proposal.status);
          }
          setError(
            body.error ||
              "This proposal has already been updated. Please review the current state.",
          );
          return;
        }
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }
      const body = await res.json();
      setStatus(body.data.status);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "paid") {
    return <ConfirmationView destination={destination} villa={villa} />;
  }

  if (status === "approved") {
    return (
      <section className="mt-12 text-center sm:mt-16" aria-live="polite">
        <p className="text-sm text-muted">
          Your itinerary has been approved.
        </p>
        <p className="mt-1 text-xs text-muted/60">
          Complete your booking to confirm your experience.
        </p>
        <button
          onClick={() => handleAction("paid")}
          disabled={loading}
          className="mt-6 rounded bg-foreground px-8 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
          aria-busy={loading}
        >
          {loading ? "Paying..." : "Pay & Lock In"}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  if (status === "draft") {
    return (
      <section className="mt-12 text-center sm:mt-16">
        <p className="text-sm text-muted">
          This proposal is being prepared.
        </p>
        <p className="mt-1 text-xs text-muted/60">
          Please check back soon or contact your concierge for assistance.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 text-center sm:mt-16" aria-live="polite">
      <p className="text-xs uppercase tracking-[0.15em] text-muted">
        Ready to confirm
      </p>
      <p className="mt-2 text-sm text-muted/60">
        You&apos;re one step away from locking in your experience.
      </p>
      <button
        onClick={() => handleAction("approved")}
        disabled={loading}
        className="mt-6 rounded bg-foreground px-8 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        aria-busy={loading}
      >
        {loading ? "Approving..." : "Approve Itinerary"}
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

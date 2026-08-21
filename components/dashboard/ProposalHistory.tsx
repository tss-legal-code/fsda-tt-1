"use client";

import { useState, useEffect } from "react";
import type { ProposalSummary } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProposalHistory({
  proposals: initialProposals,
  onSelect,
  activeProposalId,
  reservationId,
}: {
  proposals: ProposalSummary[];
  onSelect: (id: number) => void;
  activeProposalId: number | null;
  reservationId: number;
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProposals(initialProposals);
  }, [initialProposals]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to create proposal");
        return;
      }
      const newProposal = body.data;
      setProposals((prev) => [
        {
          proposal: newProposal,
          reservation: prev[0]!.reservation,
          total: 0,
        },
        ...prev,
      ]);
      onSelect(newProposal.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium text-foreground">Proposals</h2>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          {creating ? "Creating..." : "New Proposal"}
        </button>
      </div>

      {error && (
        <div className="border-b border-border bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No proposals yet"
            description="Create your first proposal to start building the itinerary."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {proposals.map((p) => (
            <li key={p.proposal.id}>
              <button
                onClick={() => onSelect(p.proposal.id)}
                className={`flex w-full items-center justify-between px-6 py-3 text-left text-sm transition-colors hover:bg-surface/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground ${
                  activeProposalId === p.proposal.id ? "bg-surface" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted">
                    #{p.proposal.id}
                  </span>
                  <StatusBadge status={p.proposal.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{formatDate(p.proposal.createdAt)}</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(p.total)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

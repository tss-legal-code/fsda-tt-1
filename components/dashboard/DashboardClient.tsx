"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ProposalSummary, ProposalDetail } from "@/lib/types";
import ProposalHistory from "./ProposalHistory";
import ProposalEditor from "./ProposalEditor";

export default function DashboardClient({
  initialProposals,
  reservationId,
  arrivalDate,
}: {
  initialProposals: ProposalSummary[];
  reservationId: number;
  arrivalDate: string;
}) {
  const [proposals, setProposals] = useState(initialProposals);
  const [activeProposalId, setActiveProposalId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeProposalIdRef = useRef(activeProposalId);

  useEffect(() => {
    activeProposalIdRef.current = activeProposalId;
  }, [activeProposalId]);

  const refreshProposals = useCallback(async () => {
    const res = await fetch("/api/proposals");
    if (res.ok) {
      const body = await res.json();
      const all = body.data as ProposalSummary[];
      setProposals(all.filter((p) => p.reservation.id === reservationId));
    }
  }, [reservationId]);

  const refreshActiveDetail = useCallback(async () => {
    const id = activeProposalIdRef.current;
    if (!id) return;
    const res = await fetch(`/api/proposals/${id}`);
    if (res.ok) {
      const body = await res.json();
      setActiveDetail(body.data);
    }
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = () => {
      refreshProposals();
      refreshActiveDetail();
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [refreshProposals, refreshActiveDetail]);

  async function handleSelect(id: number) {
    if (activeProposalId === id) {
      setActiveProposalId(null);
      setActiveDetail(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}`);
      if (!res.ok) {
        setError("Failed to load proposal.");
        return;
      }
      const body = await res.json();
      setActiveProposalId(id);
      setActiveDetail(body.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange() {
    await refreshProposals();
    if (activeProposalId) {
      const res = await fetch(`/api/proposals/${activeProposalId}`);
      if (res.ok) {
        const body = await res.json();
        setActiveDetail(body.data);
      }
    }
  }

  function handleBack() {
    setActiveProposalId(null);
    setActiveDetail(null);
    refreshProposals();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-muted">Loading...</div>
      )}

      {!loading && activeDetail && (
        <ProposalEditor
          initialDetail={activeDetail}
          arrivalDate={arrivalDate}
          onStatusChange={handleStatusChange}
          onBack={handleBack}
        />
      )}

      {!loading && !activeDetail && (
        <ProposalHistory
          proposals={proposals}
          onSelect={handleSelect}
          activeProposalId={activeProposalId}
          reservationId={reservationId}
        />
      )}
    </div>
  );
}

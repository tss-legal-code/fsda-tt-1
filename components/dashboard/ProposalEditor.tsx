"use client";

import { useState, useCallback } from "react";
import type {
  ProposalDetail,
  ItineraryCategory,
} from "@/lib/types";
import StatusBadge from "./StatusBadge";
import ItemBuilder from "./ItemBuilder";
import ItineraryList from "./ItineraryList";
import ProposalPreviewModal from "./ProposalPreviewModal";
import ProposalSendButton from "./ProposalSendButton";

export default function ProposalEditor({
  initialDetail,
  arrivalDate,
  onStatusChange,
  onBack,
}: {
  initialDetail: ProposalDetail;
  arrivalDate: string;
  onStatusChange: () => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(initialDetail.proposal.notes);
  const [notesSaving, setNotesSaving] = useState(false);

  const isDraft = detail.proposal.status === "draft";

  const refreshDetail = useCallback(async () => {
    const res = await fetch(`/api/proposals/${detail.proposal.id}`);
    if (res.ok) {
      const body = await res.json();
      setDetail(body.data);
    }
  }, [detail.proposal.id]);

  async function handleAddItem(data: {
    category: ItineraryCategory;
    title: string;
    description: string;
    scheduledAt: string;
    priceInCents: number;
  }) {
    const res = await fetch(`/api/proposals/${detail.proposal.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to add item");
    }
    await refreshDetail();
  }

  async function handleUpdateItem(
    itemId: number,
    data: {
      category?: ItineraryCategory;
      title?: string;
      description?: string;
      scheduledAt?: string;
      priceInCents?: number;
    },
  ) {
    const res = await fetch(
      `/api/proposals/${detail.proposal.id}/items/${itemId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to update item");
    }
    await refreshDetail();
  }

  async function handleRemoveItem(itemId: number) {
    const res = await fetch(
      `/api/proposals/${detail.proposal.id}/items/${itemId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to remove item");
    }
    await refreshDetail();
  }

  function handleSent() {
    refreshDetail();
    onStatusChange();
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/proposals/${detail.proposal.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        const body = await res.json();
        setDetail((prev) => ({
          ...prev,
          proposal: { ...prev.proposal, notes: body.data.notes },
        }));
      }
    } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-start gap-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button
            onClick={onBack}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            &lt; Back
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-foreground">
              Proposal #{detail.proposal.id}
            </h2>
            <StatusBadge status={detail.proposal.status} />
          </div>
        </div>
        {isDraft && detail.items.length > 0 && (
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              onClick={() => setPreviewOpen(true)}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Preview
            </button>
            <ProposalSendButton
              proposalId={detail.proposal.id}
              onSent={handleSent}
            />
          </div>
        )}
        {!isDraft && (
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <button
              onClick={() => setPreviewOpen(true)}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              View Proposal Info
            </button>
            <button
              onClick={() => window.open(`/proposal/${detail.proposal.id}`, '_blank', 'noopener,noreferrer')}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Open Proposal Page
            </button>
          </div>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            {isDraft ? "Add Item" : "Itinerary Items"}
          </h3>
          {isDraft ? (
            <ItemBuilder
              onAdd={handleAddItem}
              arrivalDate={arrivalDate}
              disabled={false}
            />
          ) : (
            <p className="text-sm text-muted">
              This proposal has been sent and is read-only.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            Itinerary
          </h3>
          <ItineraryList
            items={detail.items}
            total={detail.total}
            isDraft={isDraft}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Message to Member
        </h3>
        <p className="mb-3 text-xs text-muted/60">
          This note will appear at the top of the member&apos;s proposal page.
        </p>
        <textarea
          id="proposal-notes"
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          disabled={!isDraft}
          rows={3}
          placeholder="A personal note for James..."
          maxLength={2000}
          aria-label="Message to member"
          className="w-full resize-none rounded border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-2 focus:outline-offset-[-1px] focus:outline-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isDraft && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted/40">
              {notesValue.length}/2000
            </span>
            <button
              onClick={handleSaveNotes}
              disabled={notesSaving || notesValue === detail.proposal.notes}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-40"
            >
              {notesSaving ? "Saving..." : "Save Note"}
            </button>
          </div>
        )}
      </div>

      <ProposalPreviewModal
        detail={detail}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

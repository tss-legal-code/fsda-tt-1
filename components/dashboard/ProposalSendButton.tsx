"use client";

import { useState } from "react";

function logProposalUrlToConsole(id: number){
    const baseUrl = window.location.origin;
    const proposalUrl = `${baseUrl}/proposal/${id}`;
    const message = `View proposal page: ${proposalUrl}`
    console.log(`CONSOLE proposal sent:`, message)
}

export default function ProposalSendButton({
  proposalId,
  onSent,
}: {
  proposalId: number;
  onSent: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleSend() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
      });

      const body = await res.json();
      
      if (res.ok) {
        logProposalUrlToConsole(body.data.id)
      } else {
        setError(body.error || "Failed to send proposal");
        setConfirming(false);
        return;
      }
      onSent();
    } catch {
      setError("Something went wrong. Please try again.");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          {sending ? "Sending..." : "Confirm & Send"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={sending}
          className="rounded border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSend}
        className="rounded bg-foreground border-border px-4 py-2 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        Send Proposal
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

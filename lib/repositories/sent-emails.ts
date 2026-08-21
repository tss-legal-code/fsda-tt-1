import type Database from "better-sqlite3";
import type { SentEmail } from "@/lib/types";

interface SentEmailRow {
  id: number;
  proposal_id: number;
  to_email: string;
  sent_at: string;
  body_preview: string;
}

function toSentEmail(row: SentEmailRow): SentEmail {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    toEmail: row.to_email,
    sentAt: row.sent_at,
    bodyPreview: row.body_preview,
  };
}

export function createSentEmail(
  db: Database.Database,
  data: {
    proposalId: number;
    toEmail: string;
    sentAt: string;
    bodyPreview: string;
  },
): SentEmail {
  const result = db
    .prepare(
      "INSERT INTO sent_emails (proposal_id, to_email, sent_at, body_preview) VALUES (?, ?, ?, ?)",
    )
    .run(data.proposalId, data.toEmail, data.sentAt, data.bodyPreview);
  return {
    id: Number(result.lastInsertRowid),
    proposalId: data.proposalId,
    toEmail: data.toEmail,
    sentAt: data.sentAt,
    bodyPreview: data.bodyPreview,
  };
}

export function getSentEmailsByProposalId(
  db: Database.Database,
  proposalId: number,
): SentEmail[] {
  const rows = db
    .prepare(
      "SELECT id, proposal_id, to_email, sent_at, body_preview FROM sent_emails WHERE proposal_id = ?",
    )
    .all(proposalId) as SentEmailRow[];
  return rows.map(toSentEmail);
}

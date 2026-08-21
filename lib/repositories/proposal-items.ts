import type Database from "better-sqlite3";
import type { ProposalItem, ItineraryCategory } from "@/lib/types";

interface ProposalItemRow {
  id: number;
  proposal_id: number;
  category: ItineraryCategory;
  title: string;
  description: string;
  scheduled_at: string;
  price: number;
}

function toProposalItem(row: ProposalItemRow): ProposalItem {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    category: row.category,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    price: row.price,
  };
}

export function createProposalItem(
  db: Database.Database,
  data: {
    proposalId: number;
    category: ItineraryCategory;
    title: string;
    description: string;
    scheduledAt: string;
    price: number;
  },
): ProposalItem {
  const result = db
    .prepare(
      `INSERT INTO proposal_items (proposal_id, category, title, description, scheduled_at, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(data.proposalId, data.category, data.title, data.description, data.scheduledAt, data.price);
  return {
    id: Number(result.lastInsertRowid),
    proposalId: data.proposalId,
    category: data.category,
    title: data.title,
    description: data.description,
    scheduledAt: data.scheduledAt,
    price: data.price,
  };
}

export function getProposalItemsByProposalId(
  db: Database.Database,
  proposalId: number,
): ProposalItem[] {
  const rows = db
    .prepare(
      "SELECT id, proposal_id, category, title, description, scheduled_at, price FROM proposal_items WHERE proposal_id = ? ORDER BY scheduled_at",
    )
    .all(proposalId) as ProposalItemRow[];
  return rows.map(toProposalItem);
}

export function updateProposalItem(
  db: Database.Database,
  id: number,
  updates: Partial<Pick<ProposalItem, "category" | "title" | "description" | "scheduledAt" | "price">>,
): void {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.scheduledAt !== undefined) {
    fields.push("scheduled_at = ?");
    values.push(updates.scheduledAt);
  }
  if (updates.price !== undefined) {
    fields.push("price = ?");
    values.push(updates.price);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE proposal_items SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteProposalItem(
  db: Database.Database,
  id: number,
): void {
  db.prepare("DELETE FROM proposal_items WHERE id = ?").run(id);
}

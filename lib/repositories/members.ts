import type Database from "better-sqlite3";
import type { Member } from "@/lib/types";

interface MemberRow {
  id: number;
  name: string;
  email: string;
}

function toMember(row: MemberRow): Member {
  return { id: row.id, name: row.name, email: row.email };
}

export function getMemberById(
  db: Database.Database,
  id: number,
): Member | undefined {
  const row = db
    .prepare("SELECT id, name, email FROM members WHERE id = ?")
    .get(id) as MemberRow | undefined;
  return row ? toMember(row) : undefined;
}

export function getMemberByEmail(
  db: Database.Database,
  email: string,
): Member | undefined {
  const row = db
    .prepare("SELECT id, name, email FROM members WHERE email = ?")
    .get(email) as MemberRow | undefined;
  return row ? toMember(row) : undefined;
}

export function listMembers(db: Database.Database): Member[] {
  const rows = db
    .prepare("SELECT id, name, email FROM members ORDER BY id")
    .all() as MemberRow[];
  return rows.map(toMember);
}

export function createMember(
  db: Database.Database,
  data: { name: string; email: string },
): Member {
  const result = db
    .prepare("INSERT INTO members (name, email) VALUES (?, ?)")
    .run(data.name, data.email);
  return { id: Number(result.lastInsertRowid), name: data.name, email: data.email };
}

export function updateMember(
  db: Database.Database,
  id: number,
  data: { name: string; email: string },
): void {
  db.prepare("UPDATE members SET name = ?, email = ? WHERE id = ?")
    .run(data.name, data.email, id);
}

export function deleteMember(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM members WHERE id = ?").run(id);
}

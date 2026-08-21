import type Database from "better-sqlite3";

export function createSchema(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
      destination TEXT NOT NULL,
      villa TEXT NOT NULL,
      arrival_date TEXT NOT NULL,
      departure_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'approved', 'paid')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS proposal_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      category TEXT NOT NULL
        CHECK (category IN ('dining','activities','wellness','excursions','transport','experiences')),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scheduled_at TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0)
    );

    CREATE TABLE IF NOT EXISTS sent_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
      to_email TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      body_preview TEXT NOT NULL DEFAULT ''
    );
  `);
}

export function resetDatabase(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS sent_emails;
    DROP TABLE IF EXISTS proposal_items;
    DROP TABLE IF EXISTS proposals;
    DROP TABLE IF EXISTS reservations;
    DROP TABLE IF EXISTS members;
  `);
  createSchema(db);
}

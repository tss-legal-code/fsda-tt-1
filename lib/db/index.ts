import "server-only";
import Database from "better-sqlite3";
import path from "path";
import { createSchema } from "@/lib/db/schema";
import { seedDevelopmentData } from "@/lib/seed";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const filename = process.env.DATABASE_URL || path.join(process.cwd(), "data.db");
  db = new Database(filename);
  createSchema(db);
  seedDevelopmentData(db);
  return db;
}

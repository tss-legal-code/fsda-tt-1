import Database from "better-sqlite3";
import { createSchema } from "@/lib/db/schema";

export function createTestDatabase(): Database.Database {
  const db = new Database(":memory:");
  createSchema(db);
  return db;
}

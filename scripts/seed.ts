import Database from "better-sqlite3";
import path from "path";
import { createSchema } from "@/lib/db/schema";
import { seedDevelopmentData } from "@/lib/seed";

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

try {
  createSchema(db);
  seedDevelopmentData(db);
  console.log(`Database initialized at ${dbPath}`);
} finally {
  db.close();
}

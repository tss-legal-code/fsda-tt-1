import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/tests/setup";
import type Database from "better-sqlite3";
import {
  createMember,
  getMemberById,
  getMemberByEmail,
} from "@/lib/repositories/members";

describe("members repository", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  it("creates and retrieves a member by id", () => {
    const member = createMember(db, {
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(member.id).toBeGreaterThan(0);
    expect(member.name).toBe("Jane Doe");
    expect(member.email).toBe("jane@example.com");

    const found = getMemberById(db, member.id);
    expect(found).toEqual(member);
  });

  it("retrieves a member by email", () => {
    const member = createMember(db, {
      name: "Jane Doe",
      email: "jane@example.com",
    });
    const found = getMemberByEmail(db, "jane@example.com");
    expect(found?.id).toBe(member.id);
  });

  it("returns undefined for non-existent member", () => {
    expect(getMemberById(db, 999)).toBeUndefined();
    expect(getMemberByEmail(db, "nobody@example.com")).toBeUndefined();
  });

  it("enforces unique email constraint", () => {
    createMember(db, { name: "A", email: "dup@example.com" });
    expect(() =>
      createMember(db, { name: "B", email: "dup@example.com" }),
    ).toThrow();
  });
});

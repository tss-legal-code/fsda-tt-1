"use client";

import { useState, useEffect, useCallback } from "react";
import type { Member } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";
import EntityModal from "./EntityModal";
import type { ModalField } from "./EntityModal";

const MEMBER_FIELDS: ModalField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
];

export default function MemberList({
  onSelectMember,
  selectedMemberId,
}: {
  onSelectMember: (member: Member) => void;
  selectedMemberId: number | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const body = await res.json();
        setMembers(body.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleCreate(data: Record<string, string>) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to create member");
    }
    await fetchMembers();
  }

  async function handleUpdate(data: Record<string, string>) {
    if (!editingMember) return;
    const res = await fetch(`/api/members/${editingMember.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Failed to update member");
    }
    await fetchMembers();
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Delete ${member.name}? This will also delete all their reservations.`)) {
      return;
    }
    const res = await fetch(`/api/members/${member.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to delete member");
      return;
    }
    if (selectedMemberId === member.id) {
      onSelectMember({ id: 0, name: "", email: "" });
    }
    await fetchMembers();
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted">Loading members...</div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium text-foreground">Members</h2>
        <button
          onClick={() => {
            setEditingMember(null);
            setModalOpen(true);
          }}
          className="rounded bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Add Member
        </button>
      </div>

      {error && (
        <div className="border-b border-border bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted">
          No members yet. Add your first member to get started.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.id}>
              <div
                className={`flex w-full items-center justify-between px-6 py-3 text-left text-sm transition-colors hover:bg-surface/50 ${
                  selectedMemberId === member.id ? "bg-surface" : ""
                }`}
              >
                <button
                  onClick={() => onSelectMember(member)}
                  className="flex flex-1 items-center gap-4"
                >
                  <span className="font-mono text-xs text-muted">#{member.id}</span>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMember(member);
                      setModalOpen(true);
                    }}
                    className="rounded p-1.5 text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
                    aria-label={`Edit ${member.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(member);
                    }}
                    className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600"
                    aria-label={`Delete ${member.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <EntityModal
          title={editingMember ? "Edit Member" : "Add Member"}
          fields={MEMBER_FIELDS}
          initialValues={
            editingMember
              ? { name: editingMember.name, email: editingMember.email }
              : { name: "", email: "" }
          }
          onSubmit={editingMember ? handleUpdate : handleCreate}
          onClose={() => {
            setModalOpen(false);
            setEditingMember(null);
          }}
        />
      )}
    </section>
  );
}

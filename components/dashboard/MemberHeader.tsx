import type { Member } from "@/lib/types";

export default function MemberHeader({ member }: { member: Member }) {
  return (
    <section className="rounded-lg border border-border bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Member
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {member.name}
      </h1>
      <p className="mt-1 text-sm text-muted">{member.email}</p>
    </section>
  );
}

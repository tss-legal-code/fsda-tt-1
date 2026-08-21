import type { ProposalStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-surface text-muted",
  },
  sent: {
    label: "Sent",
    className: "bg-accent/10 text-accent",
  },
  approved: {
    label: "Approved",
    className: "bg-green-50 text-green-700",
  },
  paid: {
    label: "Paid",
    className: "bg-surface text-foreground font-medium",
  },
};

export default function StatusBadge({ status }: { status: ProposalStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

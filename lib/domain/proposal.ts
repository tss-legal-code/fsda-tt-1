import type { ProposalStatus, ProposalItem } from "@/lib/types";

const VALID_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["sent"],
  sent: ["approved"],
  approved: ["paid"],
  paid: [],
};

export function canTransitionProposalStatus(
  current: ProposalStatus,
  next: ProposalStatus,
): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}

export function calculateProposalTotal(items: ProposalItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

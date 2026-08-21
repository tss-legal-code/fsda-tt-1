export type ProposalStatus = "draft" | "sent" | "approved" | "paid";

export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  "draft",
  "sent",
  "approved",
  "paid",
];

export type ItineraryCategory =
  | "dining"
  | "activities"
  | "wellness"
  | "excursions"
  | "transport"
  | "experiences";

export const ITINERARY_ITEMS: Record<ItineraryCategory, string[]> = {
  dining: ["Private Chef Dinner", "Restaurant Reservation"],
  activities: ["Surf Lesson", "Snorkeling", "ATV Tour"],
  wellness: ["Spa Treatment", "Yoga Session", "Massage"],
  excursions: ["Whale Watching", "Sailing Charter", "Cultural Tour"],
  transport: ["Airport Transfer", "Private Car", "Helicopter"],
  experiences: ["Sunset Cocktails", "Bonfire on the Beach", "Tequila Tasting"],
};

export const CATEGORY_LABELS: Record<ItineraryCategory, string> = {
  dining: "Dining",
  activities: "Activities",
  wellness: "Wellness",
  excursions: "Excursions",
  transport: "Transport",
  experiences: "Experiences",
};

export interface Member {
  id: number;
  name: string;
  email: string;
}

export interface Reservation {
  id: number;
  memberId: number;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
}

export interface Proposal {
  id: number;
  reservationId: number;
  status: ProposalStatus;
  notes: string;
  createdAt: string;
  sentAt: string | null;
}

export interface ProposalItem {
  id: number;
  proposalId: number;
  category: ItineraryCategory;
  title: string;
  description: string;
  scheduledAt: string;
  price: number;
}

export interface SentEmail {
  id: number;
  proposalId: number;
  toEmail: string;
  sentAt: string;
  bodyPreview: string;
}

export interface ProposalDetail {
  proposal: Proposal;
  reservation: Reservation & { member: Member };
  items: ProposalItem[];
  total: number;
}

export interface ProposalSummary {
  proposal: Proposal;
  reservation: Reservation & { member: Member };
  total: number;
}



import { z } from "zod";

export const reservationIdSchema = z.object({
  reservationId: z.number().int().positive(),
});

export const updateProposalStatusSchema = z.object({
  status: z.enum(["approved", "paid"]),
});

const ITINERARY_CATEGORIES = [
  "dining",
  "activities",
  "wellness",
  "excursions",
  "transport",
  "experiences",
] as const;

export const createProposalItemSchema = z.object({
  category: z.enum(ITINERARY_CATEGORIES),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  scheduledAt: z.string().min(1, "Date/time is required"),
  priceInCents: z.number().int().min(0, "Price must be non-negative"),
});

export const updateProposalItemSchema = z.object({
  category: z.enum(ITINERARY_CATEGORIES).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().min(1).optional(),
  priceInCents: z.number().int().min(0).optional(),
});

export function parseProposalId(raw: string): number | null {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return null;
  }
  return num;
}

export const updateProposalNotesSchema = z.object({
  notes: z.string().max(2000, "Notes must be 2000 characters or fewer"),
});

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const createReservationSchema = z.object({
  memberId: z.number().int().positive(),
  destination: z.string().min(1, "Destination is required"),
  villa: z.string().min(1, "Villa is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureDate: z.string().min(1, "Departure date is required"),
});

export const updateReservationSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  villa: z.string().min(1, "Villa is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureDate: z.string().min(1, "Departure date is required"),
});

export function parseNumericId(raw: string): number | null {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return null;
  }
  return num;
}

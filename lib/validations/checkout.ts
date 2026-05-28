import { z } from "zod";

export const membershipCheckoutSchema = z.object({
  planSlug: z.enum(["basic", "premium"]),
  userId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  selectedDoctorId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  agentReferralCode: z.string().trim().min(3).max(32).optional(),
});

export type MembershipCheckoutInput = z.infer<typeof membershipCheckoutSchema>;

/** Legacy doctor-referral checkout payload */
export const createCheckoutSchema = z.object({
  planId: z.number().int().positive(),
  doctorId: z.string().uuid(),
  referralCode: z.string().trim().min(3).max(32).optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

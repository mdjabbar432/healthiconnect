import { z } from "zod";

export const doctorApplicationSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  licenseNumber: z.string().min(3).max(100),
  bio: z.string().max(2000).optional(),
  credentials: z.string().max(1000).optional(),
  specialties: z.array(z.string().min(2)).min(1),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  languages: z.array(z.string().min(2)).default([])
});

export type DoctorApplicationInput = z.infer<typeof doctorApplicationSchema>;

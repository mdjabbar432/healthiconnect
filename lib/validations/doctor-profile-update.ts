import { z } from "zod";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";
import { DIRECTORY_LANGUAGES } from "@/lib/constants/languages";

export const doctorProfileUpdateSchema = z.object({
  bio: z
    .string()
    .min(10, "Bio should be at least 10 characters")
    .max(2000, "Bio must be 2000 characters or less"),
  specialty: z.enum(DIRECTORY_SPECIALTIES),
  language: z.enum(DIRECTORY_LANGUAGES),
  location: z.string().min(2, "Location is required").max(200),
});

export type DoctorProfileUpdateInput = z.infer<typeof doctorProfileUpdateSchema>;

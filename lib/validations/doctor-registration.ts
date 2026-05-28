import { z } from "zod";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";
import { DIRECTORY_LANGUAGES } from "@/lib/constants/languages";

const specialtyEnum = z.enum(DIRECTORY_SPECIALTIES);
const languageEnum = z.enum(DIRECTORY_LANGUAGES);

const registrationFields = {
  fullName: z.string().min(2, "Full name is required").max(120),
  email: z.string().email("Enter a valid email address"),
  licenseNumber: z.string().min(3, "License number is required").max(100),
  bio: z
    .string()
    .min(10, "Bio should be at least 10 characters")
    .max(2000, "Bio must be 2000 characters or less"),
  specialty: specialtyEnum,
  language: languageEnum,
  location: z.string().min(2, "Location is required").max(200),
  photoUrl: z.string().url("Enter a valid profile photo URL").max(2048).optional(),
};

/** Server API: creates auth user + doctor profile (password required). */
export const doctorRegistrationRequestSchema = z.object({
  ...registrationFields,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or less"),
  specialty: z
    .string()
    .min(1, "Please select a specialty")
    .pipe(specialtyEnum),
  language: z.string().min(1, "Please select a language").pipe(languageEnum),
});

export type DoctorRegistrationRequest = z.infer<
  typeof doctorRegistrationRequestSchema
>;

/** Legacy: client already created auth user and passes userId. */
export const doctorRegistrationWithUserIdSchema = z.object({
  userId: z.string().uuid(),
  ...registrationFields,
});

export type DoctorRegistrationWithUserId = z.infer<
  typeof doctorRegistrationWithUserIdSchema
>;

export const doctorRegistrationFormSchema = doctorRegistrationRequestSchema;

export type DoctorRegistrationFormInput = z.infer<
  typeof doctorRegistrationFormSchema
>;

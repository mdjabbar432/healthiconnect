/** Specialty names used in directory filters and doctor registration. */
export const DIRECTORY_SPECIALTIES = [
  "Cardiology",
  "Pediatrics",
  "Dental",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Ophthalmology",
  "Psychiatry",
] as const;

export type DirectorySpecialty = (typeof DIRECTORY_SPECIALTIES)[number];

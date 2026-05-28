export const DOCTOR_DASHBOARD_SECTIONS = [
  "overview",
  "patients",
  "reviews",
  "profile",
] as const;

export type DoctorDashboardSection = (typeof DOCTOR_DASHBOARD_SECTIONS)[number];

export function parseDoctorDashboardSection(
  value: string | null | undefined,
): DoctorDashboardSection {
  if (value === "patients" || value === "reviews" || value === "profile") {
    return value;
  }
  return "overview";
}

export const DOCTOR_SECTION_COPY: Record<
  DoctorDashboardSection,
  { title: string; description: string }
> = {
  overview: {
    title: "Dashboard",
    description:
      "Manage your patients, read reviews, and keep your public profile up to date.",
  },
  patients: {
    title: "My Patients",
    description:
      "Members with an active subscription who chose you during signup.",
  },
  reviews: {
    title: "My Reviews",
    description: "Star ratings and written feedback from your patients.",
  },
  profile: {
    title: "Edit Profile",
    description:
      "Changes apply to your public directory listing after you save.",
  },
};

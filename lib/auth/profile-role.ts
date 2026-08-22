export type ProfileRole = "patient" | "doctor" | "agent" | "admin";

const PROFILE_ROLES = new Set<ProfileRole>([
  "patient",
  "doctor",
  "agent",
  "admin",
]);

export function isProfileRole(value: unknown): value is ProfileRole {
  return typeof value === "string" && PROFILE_ROLES.has(value as ProfileRole);
}

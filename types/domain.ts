export type UserRole = "patient" | "doctor" | "agent" | "admin";

export type DoctorStatus = "pending" | "approved" | "rejected";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled";

export type PartnerType = "lab" | "pharmacy" | "radiology" | "other";

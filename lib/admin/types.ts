export type AdminDoctorListItem = {
  id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
};

export type PartnerType = "lab" | "pharmacy" | "radiology" | "other";

export type AdminPartnerListItem = {
  id: number;
  name: string;
  type: PartnerType;
  address: string | null;
  services: string[];
};

export type AdminPatientLinkRow = {
  patient_id: string;
  patient_name: string;
  linked_doctor: string;
  linked_agent_id: string;
};

export type AdminAgentCommissionRow = {
  agent_id: string;
  referral_code: string;
  total_commission_cents: number;
};

export type AdminSystemStats = {
  total_patients: number;
  patient_links: AdminPatientLinkRow[];
  agent_commissions: AdminAgentCommissionRow[];
};

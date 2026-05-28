import { isDoctorApproved } from "@/lib/doctors/approval-status";

export type DoctorSessionProfile = {
  id: string;
  is_approved: boolean;
  status: string;
  slug: string | null;
};

export type DoctorSessionRow = {
  id: string;
  status: string;
  slug: string | null;
  is_approved?: boolean | null;
};

export function mapDoctorSessionRow(row: DoctorSessionRow): DoctorSessionProfile {
  return {
    id: row.id,
    status: row.status,
    slug: row.slug,
    is_approved: isDoctorApproved({
      status: row.status,
      is_approved: row.is_approved,
    }),
  };
}

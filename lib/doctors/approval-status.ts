/** Row fields used to determine whether a doctor is approved for the directory. */
export type DoctorApprovalFields = {
  status?: string | null;
  is_approved?: boolean | null;
};

/**
 * Uses `status` when present (always on base schema). Falls back to `is_approved`
 * when that column exists from the optional registration migration.
 */
export function isDoctorApproved(fields: DoctorApprovalFields): boolean {
  if (fields.is_approved === true) return true;
  const status = fields.status?.trim();
  if (status) return status === "approved";
  return false;
}

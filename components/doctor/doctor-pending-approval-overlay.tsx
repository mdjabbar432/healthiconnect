import { Clock } from "lucide-react";

export const DOCTOR_PENDING_APPROVAL_MESSAGE =
  "Your profile is under review by admin.";

export function DoctorPendingApprovalCard() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Clock className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">Profile under review</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600" role="status">
          {DOCTOR_PENDING_APPROVAL_MESSAGE}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          You will receive full dashboard access once an administrator approves your
          application.
        </p>
      </div>
    </div>
  );
}

/** @deprecated Use DoctorPendingApprovalCard — kept for imports that expect overlay name */
export const DoctorPendingApprovalOverlay = DoctorPendingApprovalCard;

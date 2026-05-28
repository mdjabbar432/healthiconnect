"use client";

import { useState } from "react";
import { AppToast } from "@/components/ui/app-toast";
import { AdminDoctorApprovalsSection } from "@/components/admin/admin-doctor-approvals-section";
import { AdminPartnersSection } from "@/components/admin/admin-partners-section";
import { AdminSystemStatsSection } from "@/components/admin/admin-system-stats-section";

export function AdminDashboard() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Control doctor approvals, partner listings, and platform-wide membership
            and commission data.
          </p>
        </div>

        <AdminDoctorApprovalsSection onToast={setToastMessage} />
        <AdminPartnersSection onToast={setToastMessage} />
        <AdminSystemStatsSection />
      </div>

      {toastMessage ? (
        <AppToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

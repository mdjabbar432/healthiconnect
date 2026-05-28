"use client";



import type { ReactNode } from "react";

import { DoctorDashboardGuard } from "@/components/doctor/doctor-dashboard-guard";

import type { DoctorSessionProfile } from "@/lib/doctors/fetch-doctor-profile";



export type DoctorPortalPageProps = {

  title: string;

  description?: string;

  /** Must be rendered inside a client component — do not pass a function from a Server Component. */

  children: ReactNode | ((doctor: DoctorSessionProfile) => ReactNode);

};



export function DoctorPortalPage({

  title,

  description,

  children,

}: DoctorPortalPageProps) {

  return (

    <DoctorDashboardGuard>

      {(doctor) => (

        <div className="space-y-6">

          <div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">

              {title}

            </h1>

            {description ? (

              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">

                {description}

              </p>

            ) : null}

          </div>

          {typeof children === "function" ? children(doctor) : children}

        </div>

      )}

    </DoctorDashboardGuard>

  );

}


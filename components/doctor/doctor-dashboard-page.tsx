"use client";



import { Suspense, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import { DoctorDashboardGuard } from "@/components/doctor/doctor-dashboard-guard";

import { DoctorDashboardContent } from "@/components/doctor/doctor-dashboard-content";

import {

  parseDoctorDashboardSection,

  type DoctorDashboardSection,

} from "@/components/doctor/doctor-dashboard-sections";



function DoctorDashboardPageInner() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const section = parseDoctorDashboardSection(searchParams.get("section"));



  const handleSectionChange = useCallback(

    (next: DoctorDashboardSection) => {

      const href =

        next === "overview"

          ? "/doctor/dashboard"

          : `/doctor/dashboard?section=${next}`;

      router.push(href, { scroll: false });

      document

        .getElementById("doctor-dashboard-main")

        ?.scrollIntoView({ behavior: "smooth", block: "start" });

    },

    [router],

  );



  return (

    <DoctorDashboardGuard

      activeSection={section}

      onSectionChange={handleSectionChange}

    >

      {(doctor) => <DoctorDashboardContent doctor={doctor} section={section} />}

    </DoctorDashboardGuard>

  );

}



function DoctorDashboardLoading() {

  return (

    <div

      className="flex min-h-[50vh] items-center justify-center bg-slate-50"

      aria-busy="true"

      aria-label="Loading dashboard"

    >

      <Loader2 className="h-10 w-10 animate-spin text-hc-brand" />

    </div>

  );

}



export function DoctorDashboardPage() {

  return (

    <Suspense fallback={<DoctorDashboardLoading />}>

      <DoctorDashboardPageInner />

    </Suspense>

  );

}


"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import {
  fetchDoctorPatients,
  type DoctorPatientRow,
} from "@/lib/doctors/fetch-doctor-patients";

function formatLinkedDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export type DoctorMyPatientsProps = {
  doctorId: string;
  compact?: boolean;
};

export function DoctorMyPatients({ doctorId, compact = false }: DoctorMyPatientsProps) {
  const [patients, setPatients] = useState<DoctorPatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchDoctorPatients(doctorId);
      if (cancelled) return;
      setPatients(result.patients);
      setError(result.error);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        compact ? "p-5" : "p-6"
      }`}
      aria-labelledby="doctor-my-patients-heading"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex rounded-lg bg-[rgba(38,118,127,0.09)] p-2 text-hc-brand">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2
            id="doctor-my-patients-heading"
            className="text-lg font-semibold text-slate-900"
          >
            My Patients
          </h2>
          <p className="text-sm text-slate-600">
            Active members who selected you as their doctor.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-8" aria-busy="true">
          <Loader2 className="h-7 w-7 animate-spin text-hc-brand" />
        </div>
      ) : error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : patients.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          No active patients have chosen you yet. Approved profiles appear in the
          public directory so members can select you during membership signup.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100">
          {patients.map((patient) => (
            <li
              key={patient.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium text-slate-900">{patient.fullName}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Linked {formatLinkedDate(patient.linkedAt)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                  {patient.membershipStatus.replace(/_/g, " ")}
                </span>
                {patient.planName ? (
                  <p className="mt-1 text-xs text-slate-600">{patient.planName}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

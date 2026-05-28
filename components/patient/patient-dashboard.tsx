"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CreditCard,
  Loader2,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { fetchPatientDashboardData } from "@/lib/patients/fetch-patient-dashboard-data";
import type { PatientDashboardData } from "@/lib/patients/fetch-patient-dashboard-data";
import { getSupabaseClient, isSupabaseClientConfigured } from "@/lib/supabase/client";

function formatPlanStatus(status: string | null): string {
  if (!status) return "No active plan";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PatientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const dashboard = await fetchPatientDashboardData();
      if (cancelled) return;

      if (!dashboard) {
        router.replace("/sign-in?redirect=/patient/dashboard");
        return;
      }

      setData(dashboard);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    router.replace("/sign-in");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-hc-brand" aria-hidden />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (!data) return null;

  const hasActivePlan = data.planStatus === "active";
  const hasChosenDoctor = Boolean(data.doctorId);
  const doctorProfileHref = data.doctorId ? `/doctors/${data.doctorId}` : "/doctors";
  const doctorDisplayName = data.doctorName?.trim() || "Your doctor";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Patient dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Hello, {data.fullName}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-hc-brand">
              <CreditCard className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900">Membership plan</h2>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {data.planName ?? "Not subscribed"}
            </p>
            <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                hasActivePlan
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {formatPlanStatus(data.planStatus)}
            </p>
            {!hasActivePlan ? (
              <Link
                href="/membership"
                className="mt-4 inline-block text-sm font-semibold text-hc-brand hover:underline"
              >
                Browse membership plans
              </Link>
            ) : null}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-hc-brand">
              <BadgeCheck className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900">Insurance agent</h2>
            </div>
            <p className="mt-4 font-mono text-xl font-bold tracking-wide text-slate-900">
              {data.agentReferralCode ?? "None linked"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {data.agentReferralCode
                ? "This Agent ID was applied at checkout and earns referral commissions."
                : "No agent was linked. Add an Agent ID on the membership page before checkout."}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2">
            <div className="flex items-center gap-3 text-hc-brand">
              <Stethoscope className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900">Chosen doctor</h2>
            </div>
            {hasChosenDoctor ? (
              <>
                <Link
                  href={doctorProfileHref}
                  className="mt-4 block text-lg font-semibold text-slate-900 transition hover:text-hc-brand"
                >
                  {doctorDisplayName}
                </Link>
                {data.doctorSpecialty ? (
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {data.doctorSpecialty}
                  </p>
                ) : null}
                <Link
                  href={doctorProfileHref}
                  className="mt-3 inline-block text-sm font-semibold text-hc-brand hover:underline"
                >
                  View doctor profile
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Not selected yet
                </p>
                <Link
                  href="/doctors"
                  className="mt-3 inline-block text-sm font-semibold text-hc-brand hover:underline"
                >
                  Browse doctors
                </Link>
              </>
            )}
          </article>
        </div>

        {!isSupabaseClientConfigured() ? (
          <p className="mt-8 text-sm text-amber-700">
            Supabase is not configured. Dashboard data requires NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        ) : null}
      </div>
    </div>
  );
}

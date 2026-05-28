"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { DoctorDashboardLayout } from "@/components/doctor/doctor-dashboard-layout";
import { DoctorPendingApprovalCard } from "@/components/doctor/doctor-pending-approval-overlay";
import {
  fetchDoctorProfileForUser,
  type DoctorSessionProfile,
} from "@/lib/doctors/fetch-doctor-profile";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import type { ReactNode } from "react";
import type { DoctorDashboardSection } from "@/components/doctor/doctor-dashboard-sections";

type GuardState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "no_profile" }
  | { status: "error"; message: string }
  | { status: "ready"; doctor: DoctorSessionProfile };

export type DoctorDashboardGuardProps = {
  children: (doctor: DoctorSessionProfile) => ReactNode;
  activeSection?: DoctorDashboardSection;
  onSectionChange?: (section: DoctorDashboardSection) => void;
};

export function DoctorDashboardGuard({
  children,
  activeSection = "overview",
  onSectionChange,
}: DoctorDashboardGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({ status: "loading" });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      setState({
        status: "error",
        message:
          "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });
      return;
    }

    let cancelled = false;

    async function load() {
      const client = getSupabaseClient();
      if (!client) {
        setState({
          status: "error",
          message:
            "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        });
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user?.id;
      const accessToken = sessionData.session?.access_token;

      if (!userId) {
        if (!cancelled) {
          router.replace("/doctor/login");
          setState({ status: "unauthenticated" });
        }
        return;
      }

      const { doctor, error } = await fetchDoctorProfileForUser(userId, {
        accessToken,
      });
      if (cancelled) return;

      if (error) {
        setState({
          status: "error",
          message: "We could not load your doctor profile. Please try again.",
        });
        return;
      }

      if (!doctor) {
        await client.auth.signOut();
        setState({ status: "no_profile" });
        return;
      }

      setState({ status: "ready", doctor });
    }

    void load();

    const client = getSupabaseClient();
    if (!client) return;

    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          router.replace("/doctor/login");
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    router.replace("/doctor/login");
  }

  if (state.status === "loading" || state.status === "unauthenticated") {
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

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </div>
      </div>
    );
  }

  if (state.status === "no_profile") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">No doctor profile found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This account is not linked to a doctor record. Complete registration to
          access the dashboard.
        </p>
        <Link
          href="/doctor/register"
          className="mt-6 inline-flex rounded-[10px] bg-hc-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-hc-brand-hover"
        >
          Apply as a doctor
        </Link>
      </div>
    );
  }

  const layoutProps = {
    activeSection,
    onSectionChange: onSectionChange ?? (() => {}),
    onSignOut: handleSignOut,
    signingOut,
  };

  if (!state.doctor.is_approved) {
    return (
      <DoctorDashboardLayout {...layoutProps}>
        <DoctorPendingApprovalCard />
      </DoctorDashboardLayout>
    );
  }

  return (
    <DoctorDashboardLayout {...layoutProps}>
      {children(state.doctor)}
    </DoctorDashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Copy,
  DollarSign,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";
import { fetchAgentDashboardData } from "@/lib/agents/fetch-agent-dashboard-data";
import type { AgentDashboardData } from "@/lib/agents/fetch-agent-dashboard-data";
import { getSupabaseClient } from "@/lib/supabase/client";

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function AgentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const dashboard = await fetchAgentDashboardData();
      if (cancelled) return;

      if (!dashboard) {
        router.replace("/agent/sign-in?redirect=/agent/dashboard");
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
    router.replace("/agent/sign-in");
  }

  async function copyReferralCode() {
    if (!data?.referralCode) return;
    await navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Agent dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome, {data.fullName}
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

        <div className="mt-8 rounded-2xl border border-hc-brand/20 bg-[rgba(38,118,127,0.06)] p-6">
          <div className="flex items-center gap-3 text-hc-brand">
            <Briefcase className="h-6 w-6" aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Your Agent ID</h2>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold tracking-wide text-slate-900">
            {data.referralCode}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Patients enter this code on the membership page when subscribing.
          </p>
          <button
            type="button"
            onClick={() => void copyReferralCode()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? "Copied!" : "Copy Agent ID"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-hc-brand">
              <Users className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900">Active referred patients</h2>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-slate-900">
              {data.activeReferredPatients}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Patients with an active membership linked to your Agent ID.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-hc-brand">
              <DollarSign className="h-6 w-6" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900">Commission balance</h2>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-slate-900">
              {formatUsd(data.totalCommissionCents)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              $10 per first payment, $5 per monthly renewal (recorded in agent commissions).
            </p>
          </article>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          New agent?{" "}
          <Link href="/agent/sign-up" className="font-semibold text-hc-brand hover:underline">
            Register another account
          </Link>
        </p>
      </div>
    </div>
  );
}

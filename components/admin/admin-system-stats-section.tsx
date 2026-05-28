"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { formatUsd } from "@/lib/admin/format-usd";
import type { AdminSystemStats } from "@/lib/admin/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stats: AdminSystemStats };

export function AdminSystemStatsSection() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  const loadStats = useCallback(async () => {
    setLoadState({ status: "loading" });

    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const body = (await res.json()) as {
        stats?: AdminSystemStats;
        error?: string;
        details?: string;
      };

      if (!res.ok || !body.stats) {
        setLoadState({
          status: "error",
          message: body.details ?? body.error ?? "Could not load system stats.",
        });
        return;
      }

      setLoadState({ status: "ready", stats: body.stats });
    } catch {
      setLoadState({
        status: "error",
        message: "Network error while loading stats. Please try again.",
      });
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <section
      id="system-stats"
      className="scroll-mt-6 space-y-4"
      aria-labelledby="system-stats-heading"
    >
      <div>
        <h2
          id="system-stats-heading"
          className="text-lg font-semibold text-slate-900 sm:text-xl"
        >
          Global overview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Platform-wide patient registrations, care-team links, and agent commission
          totals.
        </p>
      </div>

      {loadState.status === "loading" ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-12 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading system stats…
        </div>
      ) : null}

      {loadState.status === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Could not load stats</p>
            <p className="mt-1">{loadState.message}</p>
            <button
              type="button"
              onClick={() => void loadStats()}
              className="mt-3 font-medium text-red-900 underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {loadState.status === "ready" ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-lg bg-hc-brand/10 p-2 text-hc-brand">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-600">Total patients</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loadState.stats.total_patients}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Patient care links
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Patient name · linked doctor · linked agent ID
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Patient
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Linked doctor
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Linked agent ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadState.stats.patient_links.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No patients registered yet.
                      </td>
                    </tr>
                  ) : (
                    loadState.stats.patient_links.map((row) => (
                      <tr key={row.patient_id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 sm:px-6">
                          {row.patient_name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-6">
                          {row.linked_doctor}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 sm:px-6">
                          {row.linked_agent_id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Agent commission payout tracker
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Total earned commission per agent referral code
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Agent ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Total earned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadState.stats.agent_commissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No commission earnings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    loadState.stats.agent_commissions.map((row) => (
                      <tr key={row.agent_id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-slate-900 sm:px-6">
                          {row.referral_code}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 sm:px-6">
                          {formatUsd(row.total_commission_cents)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

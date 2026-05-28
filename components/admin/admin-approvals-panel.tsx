"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, X } from "lucide-react";
import { AppToast } from "@/components/ui/app-toast";
import type { AdminDoctorListItem } from "@/lib/admin/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; doctors: AdminDoctorListItem[] };

export function AdminApprovalsPanel() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [actingId, setActingId] = useState<string | null>(null);
  const [actingType, setActingType] = useState<"approve" | "deny" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    setLoadState({ status: "loading" });

    try {
      const res = await fetch("/api/admin/doctors?pending=true", {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        doctors?: AdminDoctorListItem[];
        error?: string;
        details?: string;
      };

      if (!res.ok) {
        setLoadState({
          status: "error",
          message: body.details ?? body.error ?? "Could not load doctors.",
        });
        return;
      }

      setLoadState({
        status: "ready",
        doctors: body.doctors ?? [],
      });
    } catch {
      setLoadState({
        status: "error",
        message: "Network error while loading doctors. Please try again.",
      });
    }
  }, []);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  async function handleApprove(doctor: AdminDoctorListItem) {
    if (actingId) return;

    setActingId(doctor.id);
    setActingType("approve");

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}/approve`, {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string; details?: string };

      if (!res.ok) {
        setToastMessage(
          body.details ?? body.error ?? "Approval failed. Please try again.",
        );
        return;
      }

      setToastMessage(`${doctor.full_name} has been approved.`);
      await loadDoctors();
    } catch {
      setToastMessage("Network error while approving. Please try again.");
    } finally {
      setActingId(null);
      setActingType(null);
    }
  }

  async function handleDeny(doctor: AdminDoctorListItem) {
    if (actingId) return;

    const confirmed = window.confirm(
      `Deny ${doctor.full_name}? They will not appear in the public directory.`,
    );
    if (!confirmed) return;

    setActingId(doctor.id);
    setActingType("deny");

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}/deny`, {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string; details?: string };

      if (!res.ok) {
        setToastMessage(
          body.details ?? body.error ?? "Deny failed. Please try again.",
        );
        return;
      }

      setToastMessage(`${doctor.full_name} has been denied.`);
      await loadDoctors();
    } catch {
      setToastMessage("Network error while denying. Please try again.");
    } finally {
      setActingId(null);
      setActingType(null);
    }
  }

  const pendingCount =
    loadState.status === "ready" ? loadState.doctors.length : 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Doctor approvals
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Review registered doctors and approve profiles so they appear in the
              public directory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDoctors()}
            disabled={loadState.status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadState.status === "loading" ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>

        {loadState.status === "ready" ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{pendingCount}</span>{" "}
            awaiting approval
            {pendingCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {loadState.status === "loading" ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Loading doctors…
          </div>
        ) : null}

        {loadState.status === "error" ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Could not load doctors</p>
              <p className="mt-1">{loadState.message}</p>
              <button
                type="button"
                onClick={() => void loadDoctors()}
                className="mt-3 font-medium text-red-900 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {loadState.status === "ready" ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 sm:px-6"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadState.doctors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No doctors awaiting approval.
                      </td>
                    </tr>
                  ) : (
                    loadState.doctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900 sm:px-6">
                          {doctor.full_name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 sm:px-6">
                          {doctor.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              doctor.is_approved
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                doctor.is_approved
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              aria-hidden
                            />
                            {doctor.is_approved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleApprove(doctor)}
                              disabled={actingId === doctor.id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-hc-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-50 sm:text-sm"
                            >
                              {actingId === doctor.id &&
                              actingType === "approve" ? (
                                <>
                                  <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden
                                  />
                                  Approving…
                                </>
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeny(doctor)}
                              disabled={actingId === doctor.id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:text-sm"
                            >
                              {actingId === doctor.id && actingType === "deny" ? (
                                <>
                                  <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden
                                  />
                                  Denying…
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4" aria-hidden />
                                  Deny
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {toastMessage ? (
        <AppToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}
    </>
  );
}

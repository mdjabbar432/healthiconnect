"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Loader2,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import type { MembershipPlan } from "@/lib/membership/plans";

export type CheckoutDoctorOption = {
  id: string;
  fullName: string;
  specialties: string[];
  city: string | null;
};

type MembershipCheckoutModalProps = {
  plan: MembershipPlan;
  doctors: CheckoutDoctorOption[];
  patientUserId: string | null;
  stripeLive: boolean;
  onClose: () => void;
};

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

export function MembershipCheckoutModal({
  plan,
  doctors,
  patientUserId,
  stripeLive,
  onClose,
}: MembershipCheckoutModalProps) {
  const [agentReferralCode, setAgentReferralCode] = useState("");
  const [agentCodeHint, setAgentCodeHint] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validatingAgent, setValidatingAgent] = useState(false);
  const isSignedInPatient = Boolean(patientUserId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) => {
      const haystack = [
        doctor.fullName,
        doctor.city ?? "",
        ...doctor.specialties,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [doctorSearch, doctors]);

  async function validateAgentCode(code: string): Promise<boolean> {
    const trimmed = code.trim();
    if (!trimmed) return true;

    setValidatingAgent(true);
    try {
      const res = await fetch(
        `/api/agents/validate-referral?code=${encodeURIComponent(trimmed)}`,
      );
      const data = (await res.json()) as { valid?: boolean; referralCode?: string };

      if (!res.ok || !data.valid) {
        setAgentCodeHint(null);
        setError("Insurance Agent ID not found. Check the code and try again.");
        return false;
      }

      setAgentCodeHint(
        data.referralCode
          ? `Agent ID verified: ${data.referralCode}`
          : "Agent ID verified.",
      );
      return true;
    } catch {
      setError("Unable to validate Agent ID. Please try again.");
      return false;
    } finally {
      setValidatingAgent(false);
    }
  }

  async function handleContinue() {
    setError(null);

    if (!patientUserId) {
      setError("Sign in as a patient to continue with checkout.");
      return;
    }

    if (!selectedDoctorId) {
      setError("Please select your preferred doctor to continue.");
      return;
    }

    if (agentReferralCode.trim()) {
      const valid = await validateAgentCode(agentReferralCode);
      if (!valid) return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          patientId: patientUserId,
          selectedDoctorId,
          agentReferralCode: agentReferralCode.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("Checkout URL was not returned.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close checkout"
        onClick={onClose}
      />

      <div
        className="relative z-[201] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-hc-brand">
              Complete subscription
            </p>
            <h2 id="checkout-modal-title" className="mt-1 text-xl font-bold text-slate-900">
              {plan.name} — {plan.priceLabel}/mo
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {stripeLive
                ? "You will be redirected to Stripe to complete payment."
                : "Demo mode: your dashboard will update immediately without Stripe."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {!isSignedInPatient ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
              <p className="font-semibold text-sky-950">Patient sign-in required</p>
              <p className="mt-1">
                Sign in or create a free patient account to choose your doctor and subscribe.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/sign-in?redirect=/membership"
                  className="inline-flex rounded-lg bg-hc-brand px-4 py-2 text-sm font-bold text-white hover:bg-hc-brand-hover"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up?redirect=/membership"
                  className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="checkout-agent-id"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Insurance Agent ID{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="checkout-agent-id"
              type="text"
              value={agentReferralCode}
              onChange={(e) => {
                setAgentReferralCode(e.target.value.toUpperCase());
                setAgentCodeHint(null);
              }}
              placeholder="e.g. AG-TEST123"
              className={`${inputClassName} uppercase tracking-wide`}
              disabled={!isSignedInPatient || submitting || validatingAgent}
              autoComplete="off"
            />
            {agentCodeHint ? (
              <p className="mt-1.5 text-xs font-medium text-emerald-700">{agentCodeHint}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Link your insurance agent to earn them referral commissions.
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-700">
                Preferred doctor <span className="text-red-600">*</span>
              </label>
              <Link
                href="/doctors"
                className="text-xs font-semibold text-hc-brand hover:underline"
                target="_blank"
              >
                Browse directory
              </Link>
            </div>

            {doctors.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No approved doctors are available yet.{" "}
                <Link href="/doctors" className="font-semibold underline">
                  Check the directory
                </Link>{" "}
                or try again later.
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search by name or specialty"
                    className={`${inputClassName} pl-10`}
                    disabled={!isSignedInPatient || submitting}
                  />
                </div>

                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {filteredDoctors.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-slate-500">
                      No doctors match your search.
                    </li>
                  ) : (
                    filteredDoctors.map((doctor) => {
                      const selected = selectedDoctorId === doctor.id;
                      const specialty =
                        doctor.specialties[0] ?? "General practice";
                      const location = doctor.city ? ` · ${doctor.city}` : "";

                      return (
                        <li key={doctor.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedDoctorId(doctor.id)}
                            className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                              selected
                                ? "border-2 border-hc-brand bg-[rgba(38,118,127,0.08)]"
                                : "border-2 border-transparent hover:bg-slate-50"
                            }`}
                            disabled={!isSignedInPatient || submitting}
                          >
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                selected ? "bg-hc-brand text-white" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {selected ? (
                                <Stethoscope className="h-4 w-4" aria-hidden />
                              ) : (
                                <UserRound className="h-4 w-4" aria-hidden />
                              )}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">
                                {doctor.fullName}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-600">
                                {specialty}
                                {location}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={
              !isSignedInPatient ||
              submitting ||
              validatingAgent ||
              doctors.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-hc-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-hc-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {stripeLive ? "Redirecting to Stripe…" : "Activating membership…"}
              </>
            ) : !isSignedInPatient ? (
              "Sign in to continue"
            ) : stripeLive ? (
              "Continue to Stripe Checkout"
            ) : (
              "Activate membership (demo)"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

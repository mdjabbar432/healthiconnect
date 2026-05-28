"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Shield, Sparkles } from "lucide-react";
import {
  MembershipCheckoutModal,
  type CheckoutDoctorOption,
} from "@/components/membership/membership-checkout-modal";
import { fetchPatientSession } from "@/lib/patients/fetch-patient-session";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import type { MembershipPlan } from "@/lib/membership/plans";

type MembershipPricingProps = {
  plans: MembershipPlan[];
  doctors: CheckoutDoctorOption[];
  stripeLive: boolean;
};

export function MembershipPricing({
  plans,
  doctors,
  stripeLive,
}: MembershipPricingProps) {
  const [patientUserId, setPatientUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<MembershipPlan | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const session = await fetchPatientSession();
      if (cancelled) return;
      setPatientUserId(session?.userId ?? null);
      setCheckingAuth(false);
    }

    void loadSession();

    if (!isSupabaseClientConfigured()) {
      return () => {
        cancelled = true;
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return () => {
        cancelled = true;
      };
    }

    const { data: authListener } = client.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const openCheckout = useCallback((plan: MembershipPlan) => {
    setAuthError(null);
    setCheckoutPlan(plan);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutPlan(null);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-hc-brand/20 bg-[rgba(38,118,127,0.08)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-hc-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Membership Plans
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Simple pricing for better care
          </h1>
          <p className="mt-4 text-base leading-relaxed text-hc-muted sm:text-lg">
            Compare plans side by side, choose your preferred doctor, optionally add an
            insurance agent ID, and subscribe securely with Stripe.
          </p>
        </div>

        {!checkingAuth && !patientUserId ? (
          <div
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
            role="status"
          >
            <Link
              href="/sign-in?redirect=/membership"
              className="font-semibold text-hc-brand hover:underline"
            >
              Sign in as a patient
            </Link>{" "}
            to subscribe. New here?{" "}
            <Link
              href="/sign-up?redirect=/membership"
              className="font-semibold text-hc-brand hover:underline"
            >
              Create a free account
            </Link>
            .
          </div>
        ) : null}

        {!stripeLive ? (
          <div
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Demo mode: Stripe keys are not set. Checkout will activate your membership
            locally for testing. Add{" "}
            <code className="rounded bg-amber-100 px-1">STRIPE_SECRET_KEY</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> for live payments.
          </div>
        ) : null}

        {authError ? (
          <div
            className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {authError}
          </div>
        ) : null}

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {plans.map((plan) => {
            const isPopular = Boolean(plan.emphasized);

            return (
              <article
                key={plan.slug}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md ${
                  isPopular
                    ? "border-2 border-hc-brand shadow-[0_12px_40px_rgba(38,118,127,0.15)]"
                    : "border-slate-200"
                }`}
              >
                {isPopular ? (
                  <span className="absolute -top-3 left-8 rounded-full bg-hc-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                ) : null}

                <h2 className="text-xl font-bold text-hc-brand">{plan.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-hc-muted">{plan.description}</p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {plan.priceLabel}
                  </span>
                  <span className="text-base font-semibold text-slate-500">/ month</span>
                </p>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-hc-brand"
                        aria-hidden
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={checkoutPlan?.slug === plan.slug}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openCheckout(plan);
                  }}
                  className={`relative z-10 mt-8 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand ${
                    isPopular
                      ? "bg-hc-brand text-white hover:bg-hc-brand-hover"
                      : "border-2 border-hc-brand bg-white text-hc-brand hover:bg-[rgba(38,118,127,0.06)]"
                  }`}
                >
                  {checkingAuth ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Loading…
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">What happens when you subscribe?</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Click Subscribe and choose your preferred doctor (required).</li>
            <li>Optionally enter an Insurance Agent ID for referral tracking.</li>
            <li>Complete payment on Stripe — your dashboard updates automatically.</li>
          </ol>
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-600 sm:flex-row sm:text-left">
          <Shield className="h-8 w-8 shrink-0 text-hc-brand" aria-hidden />
          <p>
            Secure payments powered by Stripe. Your subscription renews monthly until you
            cancel from your Stripe customer portal or account settings.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already subscribed?{" "}
          <Link href="/patient/dashboard" className="font-semibold text-hc-brand hover:underline">
            Go to your dashboard
          </Link>
        </p>
      </section>

      {checkoutPlan ? (
        <MembershipCheckoutModal
          plan={checkoutPlan}
          doctors={doctors}
          patientUserId={patientUserId}
          stripeLive={stripeLive}
          onClose={closeCheckout}
        />
      ) : null}
    </div>
  );
}

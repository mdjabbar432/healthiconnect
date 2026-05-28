import type Stripe from "stripe";
import { resolveAgentByReferralCode } from "@/lib/agents/resolve-referral-code";
import { validateApprovedDoctor } from "@/lib/doctors/validate-checkout-doctor";
import { fetchMembershipPlans } from "@/lib/membership/fetch-plans";
import {
  getPlanBySlug,
  isPlaceholderStripePriceId,
  type MembershipPlanSlug,
} from "@/lib/membership/plans";
import { fulfillDemoSubscription } from "@/lib/membership/fulfill-demo-subscription";
import { markSubscriptionCheckoutPending } from "@/lib/membership/subscription-metadata";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CreateMembershipCheckoutInput = {
  planSlug: MembershipPlanSlug;
  userId?: string;
  patientId?: string;
  selectedDoctorId: string;
  customerEmail?: string;
  agentReferralCode?: string;
};

export type CreateMembershipCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; status: number; error: string };

function buildLineItem(plan: {
  name: string;
  priceCents: number;
  interval: "month" | "year";
  stripePriceId?: string | null;
}): Stripe.Checkout.SessionCreateParams.LineItem {
  if (plan.stripePriceId && !isPlaceholderStripePriceId(plan.stripePriceId)) {
    return { price: plan.stripePriceId, quantity: 1 };
  }

  return {
    price_data: {
      currency: "usd",
      unit_amount: plan.priceCents,
      recurring: { interval: plan.interval },
      product_data: {
        name: plan.name,
        description: "HealthiConnect membership",
      },
    },
    quantity: 1,
  };
}

function buildStripeMetadata(params: {
  planSlug: MembershipPlanSlug;
  planId?: number;
  patientId: string;
  agentId?: string;
  agentReferralCode?: string;
  selectedDoctorId: string;
}): Record<string, string> {
  return {
    planSlug: params.planSlug,
    planId: params.planId != null ? String(params.planId) : "",
    patientId: params.patientId,
    patient_id: params.patientId,
    userId: params.patientId,
    agentId: params.agentId ?? "",
    agent_id: params.agentId ?? "",
    agentReferralCode: params.agentReferralCode ?? "",
    selectedDoctorId: params.selectedDoctorId,
    selected_doctor_id: params.selectedDoctorId,
  };
}

export async function createMembershipCheckoutSession(
  input: CreateMembershipCheckoutInput,
): Promise<CreateMembershipCheckoutResult> {
  const staticPlan = getPlanBySlug(input.planSlug);
  if (!staticPlan) {
    return { ok: false, status: 400, error: "Unknown membership plan." };
  }

  const patientId = input.patientId ?? input.userId;
  if (!patientId) {
    return {
      ok: false,
      status: 401,
      error: "Sign in as a patient before subscribing to a membership plan.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      error: "Server database is not configured.",
    };
  }

  const doctorValid = await validateApprovedDoctor(admin, input.selectedDoctorId);
  if (!doctorValid) {
    return {
      ok: false,
      status: 400,
      error: "Please select an approved doctor from the directory.",
    };
  }

  const plans = await fetchMembershipPlans();
  const plan = plans.find((p) => p.slug === input.planSlug) ?? staticPlan;

  let agentId: string | undefined;
  let agentReferralCode: string | undefined;

  if (input.agentReferralCode?.trim()) {
    const agent = await resolveAgentByReferralCode(admin, input.agentReferralCode);
    if (!agent) {
      return {
        ok: false,
        status: 400,
        error: "Insurance Agent ID not found. Check the code and try again.",
      };
    }

    agentId = agent.agentId;
    agentReferralCode = agent.referralCode;
  }

  const stripeMetadata = buildStripeMetadata({
    planSlug: plan.slug,
    planId: plan.planId,
    patientId,
    agentId,
    agentReferralCode,
    selectedDoctorId: input.selectedDoctorId,
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  if (!isStripeConfigured()) {
    const fulfillment = await fulfillDemoSubscription(admin, {
      patientId,
      planSlug: plan.slug,
      planId: plan.planId,
      agentId,
      chosenDoctorId: input.selectedDoctorId,
    });

    if (!fulfillment.ok) {
      return {
        ok: false,
        status: 500,
        error: `Demo checkout failed (${fulfillment.step}): ${fulfillment.message}`,
      };
    }

    return {
      ok: true,
      url: `${appUrl}/membership/success?mock=1&plan=${input.planSlug}`,
      sessionId: `mock_session_${input.planSlug}`,
    };
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      buildLineItem({
        name: plan.name,
        priceCents: plan.priceCents,
        interval: plan.interval,
        stripePriceId: plan.stripePriceId,
      }),
    ],
    success_url: `${appUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/membership/cancel`,
    client_reference_id: patientId,
    customer_email: input.customerEmail,
    metadata: stripeMetadata,
    subscription_data: {
      metadata: stripeMetadata,
    },
  });

  if (!session.url) {
    return { ok: false, status: 500, error: "Stripe did not return a checkout URL." };
  }

  await markSubscriptionCheckoutPending(patientId, plan.slug, session.id);

  return { ok: true, url: session.url, sessionId: session.id };
}

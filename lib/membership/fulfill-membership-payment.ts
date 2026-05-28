import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { MembershipPlanSlug } from "@/lib/membership/plans";
import { recordFirstPaymentCommission } from "@/lib/membership/record-commission";
import { activateSubscriptionFromCheckout } from "@/lib/membership/subscription-metadata";

function parsePlanSlug(value: string | undefined): MembershipPlanSlug | null {
  if (value === "basic" || value === "premium") return value;
  return null;
}

function readMetadataId(
  metadata: Stripe.Metadata | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export async function fulfillCheckoutSessionCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const planSlug = parsePlanSlug(session.metadata?.planSlug);
  if (!planSlug) return;

  const patientId =
    readMetadataId(session.metadata, "patientId", "patient_id", "userId") ||
    session.client_reference_id ||
    undefined;

  const planIdRaw = session.metadata?.planId;
  const planId = planIdRaw ? Number.parseInt(planIdRaw, 10) : undefined;
  const agentId = readMetadataId(session.metadata, "agentId", "agent_id");
  const chosenDoctorId = readMetadataId(
    session.metadata,
    "selectedDoctorId",
    "selected_doctor_id",
  );

  await activateSubscriptionFromCheckout({
    userId: patientId,
    planSlug,
    planId: Number.isFinite(planId) ? planId : undefined,
    agentId,
    chosenDoctorId,
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null,
  });
}

export async function recordInvoicePaymentAndCommission(
  admin: SupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionRef = invoice.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

  if (!subscriptionId || invoice.amount_paid <= 0) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = subscription.metadata;

  const patientId =
    readMetadataId(metadata, "patientId", "patient_id", "userId") || undefined;

  if (!patientId) return;

  const planSlug = parsePlanSlug(metadata?.planSlug);
  const agentId = readMetadataId(metadata, "agentId", "agent_id");
  const chosenDoctorId = readMetadataId(
    metadata,
    "selectedDoctorId",
    "selected_doctor_id",
  );

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  let membershipQuery = admin
    .from("patient_memberships")
    .select("id, plan_id")
    .eq("patient_id", patientId);

  if (stripeCustomerId) {
    membershipQuery = membershipQuery.eq("stripe_customer_id", stripeCustomerId);
  }

  const { data: membership } = await membershipQuery.maybeSingle();

  if (!membership) {
    if (planSlug) {
      await activateSubscriptionFromCheckout({
        userId: patientId,
        planSlug,
        agentId,
        chosenDoctorId,
        stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
      });
    }
    return;
  }

  const invoiceId = invoice.id;
  if (!invoiceId) return;

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();

  if (existingPayment) return;

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      patient_membership_id: membership.id,
      stripe_invoice_id: invoiceId,
      stripe_payment_intent_id:
        typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id ?? null,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency ?? "usd",
      paid_at: new Date(
        (invoice.status_transitions?.paid_at ?? Date.now() / 1000) * 1000,
      ).toISOString(),
      status: "paid",
    })
    .select("id")
    .single();

  await admin
    .from("patient_memberships")
    .update({
      status: "active",
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  if (planSlug) {
    await activateSubscriptionFromCheckout({
      userId: patientId,
      planSlug,
      planId: membership.plan_id,
      agentId,
      chosenDoctorId,
      stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });
  }

  if (paymentError || !payment) return;

  const resolvedAgentId =
    agentId ||
    (
      await admin
        .from("patients")
        .select("referral_agent_id")
        .eq("id", patientId)
        .maybeSingle()
    ).data?.referral_agent_id;

  if (!resolvedAgentId) return;

  await recordFirstPaymentCommission(admin, {
    agentId: resolvedAgentId,
    patientId,
    patientMembershipId: membership.id,
    stripeInvoiceId: invoiceId,
    paymentAmountCents: invoice.amount_paid,
  });
}

import type { MembershipPlanSlug } from "@/lib/membership/plans";
import { resolvePlanIdBySlug } from "@/lib/membership/resolve-plan-id";
import { updatePatientCheckoutSelections } from "@/lib/patients/update-patient-checkout-selections";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type SubscriptionUserMetadata = {
  subscription_tier?: MembershipPlanSlug | string;
  subscription_status?: "checkout_pending" | "active" | "canceled" | "past_due" | "inactive";
  stripe_checkout_session_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
};

export type ActivateSubscriptionResult =
  | { ok: true; membershipId: number }
  | { ok: false; step: string; message: string };

export async function markSubscriptionCheckoutPending(
  userId: string | undefined,
  planSlug: MembershipPlanSlug,
  stripeSessionId: string,
): Promise<void> {
  if (!userId) return;

  const admin = getSupabaseAdmin();
  if (!admin) return;

  const metadata: SubscriptionUserMetadata = {
    subscription_tier: planSlug,
    subscription_status: "checkout_pending",
    stripe_checkout_session_id: stripeSessionId,
  };

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });
}

export async function activateSubscriptionFromCheckout(params: {
  userId: string | undefined;
  planSlug: MembershipPlanSlug;
  planId?: number;
  agentId?: string;
  chosenDoctorId?: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}): Promise<ActivateSubscriptionResult> {
  const {
    userId,
    planSlug,
    planId: planIdInput,
    agentId,
    chosenDoctorId,
    stripeCustomerId,
    stripeSubscriptionId,
  } = params;

  if (!userId) {
    return { ok: false, step: "patient", message: "Missing patient id." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, step: "config", message: "Supabase admin is not configured." };
  }

  const metadata: SubscriptionUserMetadata = {
    subscription_tier: planSlug,
    subscription_status: "active",
    stripe_customer_id: stripeCustomerId ?? undefined,
    stripe_subscription_id: stripeSubscriptionId ?? undefined,
  };

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  if (authError) {
    return { ok: false, step: "auth_metadata", message: authError.message };
  }

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (patientError) {
    return { ok: false, step: "patient", message: patientError.message };
  }

  if (!patient) {
    return {
      ok: false,
      step: "patient",
      message: "No patient profile found for this account.",
    };
  }

  await updatePatientCheckoutSelections(admin, userId, {
    chosenDoctorId,
    agentId,
  });

  let planId = planIdInput;
  if (!planId) {
    planId = await resolvePlanIdBySlug(admin, planSlug);
  }

  if (!planId) {
    return {
      ok: false,
      step: "plan",
      message: `No active membership plan found for "${planSlug}".`,
    };
  }

  const effectiveCustomerId = stripeCustomerId ?? `mock_customer_${userId}`;
  const effectiveSubscriptionId =
    stripeSubscriptionId ?? `mock_sub_${planSlug}_${userId}`;

  const { data: existing } = await admin
    .from("patient_memberships")
    .select("id")
    .eq("patient_id", userId)
    .maybeSingle();

  const row = {
    patient_id: userId,
    plan_id: planId,
    stripe_customer_id: effectiveCustomerId,
    stripe_subscription_id: effectiveSubscriptionId,
    status: "active" as const,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("patient_memberships")
      .update(row)
      .eq("id", existing.id);

    if (updateError) {
      return { ok: false, step: "membership", message: updateError.message };
    }

    return { ok: true, membershipId: existing.id };
  }

  const { data: inserted, error: insertError } = await admin
    .from("patient_memberships")
    .insert(row)
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      ok: false,
      step: "membership",
      message: insertError?.message ?? "Failed to create membership.",
    };
  }

  return { ok: true, membershipId: inserted.id };
}

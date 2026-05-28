import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipPlanSlug } from "@/lib/membership/plans";
import { recordFirstPaymentCommission } from "@/lib/membership/record-commission";
import { resolvePlanIdBySlug } from "@/lib/membership/resolve-plan-id";
import { updatePatientCheckoutSelections } from "@/lib/patients/update-patient-checkout-selections";

export type FulfillDemoSubscriptionInput = {
  patientId: string;
  planSlug: MembershipPlanSlug;
  planId?: number;
  agentId?: string;
  chosenDoctorId: string;
};

export type FulfillDemoSubscriptionResult =
  | {
      ok: true;
      membershipId: number;
      commissionRecorded: boolean;
    }
  | { ok: false; step: string; message: string };

function mockStripeIds(patientId: string, planSlug: MembershipPlanSlug) {
  return {
    customerId: `mock_customer_${patientId}`,
    subscriptionId: `mock_sub_${planSlug}_${patientId}`,
    invoiceId: `mock_inv_${planSlug}_${patientId}`,
  };
}

export async function fulfillDemoSubscription(
  admin: SupabaseClient,
  input: FulfillDemoSubscriptionInput,
): Promise<FulfillDemoSubscriptionResult> {
  const { patientId, planSlug, agentId, chosenDoctorId } = input;

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();

  if (patientError) {
    return { ok: false, step: "patient", message: patientError.message };
  }

  if (!patient) {
    return {
      ok: false,
      step: "patient",
      message: "No patient profile found for this account. Register as a patient first.",
    };
  }

  const metadata = {
    subscription_tier: planSlug,
    subscription_status: "active",
  };

  const { error: authMetaError } = await admin.auth.admin.updateUserById(patientId, {
    user_metadata: metadata,
  });

  if (authMetaError) {
    return { ok: false, step: "auth_metadata", message: authMetaError.message };
  }

  try {
    await updatePatientCheckoutSelections(admin, patientId, {
      chosenDoctorId,
      agentId,
    });
  } catch (error) {
    return {
      ok: false,
      step: "patient_selections",
      message: error instanceof Error ? error.message : "Failed to save doctor or agent.",
    };
  }

  let planId = input.planId;
  if (!planId) {
    planId = await resolvePlanIdBySlug(admin, planSlug);
  }

  if (!planId) {
    return {
      ok: false,
      step: "plan",
      message: `No active membership plan found for "${planSlug}". Run supabase seed.sql.`,
    };
  }

  const { customerId, subscriptionId, invoiceId } = mockStripeIds(patientId, planSlug);

  const membershipRow = {
    patient_id: patientId,
    plan_id: planId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: "active" as const,
    updated_at: new Date().toISOString(),
  };

  const { data: existingMembership } = await admin
    .from("patient_memberships")
    .select("id")
    .eq("patient_id", patientId)
    .maybeSingle();

  let membershipId = existingMembership?.id;

  if (membershipId) {
    const { error: updateError } = await admin
      .from("patient_memberships")
      .update(membershipRow)
      .eq("id", membershipId);

    if (updateError) {
      return { ok: false, step: "membership", message: updateError.message };
    }
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("patient_memberships")
      .insert(membershipRow)
      .select("id")
      .single();

    if (insertError || !inserted) {
      return {
        ok: false,
        step: "membership",
        message: insertError?.message ?? "Failed to create patient membership.",
      };
    }

    membershipId = inserted.id;
  }

  let commissionRecorded = false;

  if (agentId) {
    const commissionResult = await recordFirstPaymentCommission(admin, {
      agentId,
      patientId,
      patientMembershipId: membershipId,
      stripeInvoiceId: invoiceId,
    });

    if (!commissionResult.ok) {
      return { ok: false, step: "commission", message: commissionResult.message };
    }

    commissionRecorded = commissionResult.created;
  }

  return { ok: true, membershipId, commissionRecorded };
}

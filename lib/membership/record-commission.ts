import type { SupabaseClient } from "@supabase/supabase-js";

export type RecordCommissionResult =
  | { ok: true; commissionId: number; created: boolean }
  | { ok: false; message: string };

export async function recordFirstPaymentCommission(
  admin: SupabaseClient,
  params: {
    agentId: string;
    patientId: string;
    patientMembershipId: number;
    stripeInvoiceId: string;
    /** Amount stored on the payments row (defaults to commission amount). */
    paymentAmountCents?: number;
    /** Commission credit amount (defaults from agent rate table). */
    commissionAmountCents?: number;
  },
): Promise<RecordCommissionResult> {
  const { agentId, patientId, patientMembershipId, stripeInvoiceId } = params;

  const { count: priorCommissionCount, error: countError } = await admin
    .from("commissions")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .eq("patient_id", patientId);

  if (countError) {
    return { ok: false, message: countError.message };
  }

  const isFirstCommission = (priorCommissionCount ?? 0) === 0;
  const commissionType = isFirstCommission ? "first_payment" : "recurring";

  const { data: agent, error: agentError } = await admin
    .from("agents")
    .select("commission_first_payment_cents, commission_recurring_cents")
    .eq("id", agentId)
    .maybeSingle();

  if (agentError) {
    return { ok: false, message: agentError.message };
  }

  const commissionAmountCents =
    params.commissionAmountCents ??
    (isFirstCommission
      ? (agent?.commission_first_payment_cents ?? 1000)
      : (agent?.commission_recurring_cents ?? 500));

  const paymentAmountCents = params.paymentAmountCents ?? commissionAmountCents;

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id")
    .eq("stripe_invoice_id", stripeInvoiceId)
    .maybeSingle();

  let paymentId = existingPayment?.id;

  if (!paymentId) {
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        patient_membership_id: patientMembershipId,
        stripe_invoice_id: stripeInvoiceId,
        amount_cents: paymentAmountCents,
        currency: "usd",
        paid_at: new Date().toISOString(),
        status: "paid",
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      return {
        ok: false,
        message: paymentError?.message ?? "Failed to record payment for commission.",
      };
    }

    paymentId = payment.id;
  }

  const { data: existingCommission } = await admin
    .from("commissions")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (existingCommission?.id) {
    return { ok: true, commissionId: existingCommission.id, created: false };
  }

  const { data: commission, error: commissionError } = await admin
    .from("commissions")
    .insert({
      agent_id: agentId,
      patient_id: patientId,
      payment_id: paymentId,
      commission_type: commissionType,
      amount_cents: commissionAmountCents,
      status: "approved",
    })
    .select("id")
    .single();

  if (commissionError || !commission) {
    return {
      ok: false,
      message: commissionError?.message ?? "Failed to record agent commission.",
    };
  }

  return { ok: true, commissionId: commission.id, created: true };
}

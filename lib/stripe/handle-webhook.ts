import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  fulfillCheckoutSessionCompleted,
  recordInvoicePaymentAndCommission,
} from "@/lib/membership/fulfill-membership-payment";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  const admin = getSupabaseAdmin();
  if (!admin) return;

  await fulfillCheckoutSessionCompleted(admin, session);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const stripe = getStripe();
  await recordInvoicePaymentAndCommission(admin, stripe, invoice);
}

export async function handleStripeWebhook(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ received: true, skipped: "stripe_not_configured" });
  }

  const payload = await req.text();
  const signature = (await headers()).get("stripe-signature");
  const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Missing webhook signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid webhook signature", details: String(error) },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId =
        subscription.metadata?.patientId || subscription.metadata?.userId;
      if (userId) {
        const { getSupabaseAdmin } = await import("@/lib/supabase/server");
        const admin = getSupabaseAdmin();
        if (admin) {
          await admin.auth.admin.updateUserById(userId, {
            user_metadata: { subscription_status: "canceled" },
          });

          await admin
            .from("patient_memberships")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("patient_id", userId)
            .eq("stripe_subscription_id", subscription.id);
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

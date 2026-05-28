"use client";

import { MembershipPricing } from "@/components/membership/membership-pricing";
import type { CheckoutDoctorOption } from "@/components/membership/membership-checkout-modal";
import type { MembershipPlan } from "@/lib/membership/plans";

export type MembershipPageClientProps = {
  plans: MembershipPlan[];
  doctors: CheckoutDoctorOption[];
  stripeLive: boolean;
};

/**
 * Client-only shell for /membership — all Subscribe clicks and checkout modal
 * state live here (no navigation until Stripe/demo checkout continues).
 */
export function MembershipPageClient({
  plans,
  doctors,
  stripeLive,
}: MembershipPageClientProps) {
  return (
    <MembershipPricing plans={plans} doctors={doctors} stripeLive={stripeLive} />
  );
}

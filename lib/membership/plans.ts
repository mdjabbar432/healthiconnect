export type MembershipPlanSlug = "basic" | "premium";

export type MembershipPlan = {
  slug: MembershipPlanSlug;
  name: string;
  description: string;
  priceCents: number;
  priceLabel: string;
  interval: "month" | "year";
  features: string[];
  emphasized?: boolean;
  cta: string;
  /** Optional DB id when loaded from Supabase */
  planId?: number;
  stripePriceId?: string | null;
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    slug: "basic",
    name: "Basic Plan",
    description: "Essential telehealth access for individuals getting started.",
    priceCents: 1900,
    priceLabel: "$19",
    interval: "month",
    features: [
      "Monthly video consultations",
      "Secure messaging with your care team",
      "Prescription refill requests",
      "Member dashboard & health records",
    ],
    cta: "Subscribe — Basic",
  },
  {
    slug: "premium",
    name: "Premium Plan",
    description: "Priority care, coordination, and deeper support for active patients.",
    priceCents: 4900,
    priceLabel: "$49",
    interval: "month",
    emphasized: true,
    features: [
      "Everything in Basic",
      "Priority scheduling & same-week slots",
      "Dedicated care coordination",
      "Premium partner discounts",
      "24/7 nurse line access",
    ],
    cta: "Upgrade — Premium",
  },
];

export function getPlanBySlug(slug: MembershipPlanSlug): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find((plan) => plan.slug === slug);
}

export function isPlaceholderStripePriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return true;
  return priceId.includes("placeholder");
}

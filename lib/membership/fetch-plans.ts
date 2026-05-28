import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  MEMBERSHIP_PLANS,
  type MembershipPlan,
  type MembershipPlanSlug,
} from "@/lib/membership/plans";

type DbPlanRow = {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  interval: string;
  stripe_price_id: string;
};

function slugFromDbName(name: string): MembershipPlanSlug | null {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("basic")) return "basic";
  if (normalized.includes("premium")) return "premium";
  return null;
}

function formatPriceLabel(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

export async function fetchMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return MEMBERSHIP_PLANS;
    }

    const { data, error } = await admin
      .from("membership_plans")
      .select("id, name, description, price_cents, interval, stripe_price_id")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });

    if (error || !data?.length) {
      return MEMBERSHIP_PLANS;
    }

    const merged = new Map<MembershipPlanSlug, MembershipPlan>();

    for (const fallback of MEMBERSHIP_PLANS) {
      merged.set(fallback.slug, { ...fallback });
    }

    for (const row of data as DbPlanRow[]) {
      const slug = slugFromDbName(row.name);
      if (!slug) continue;

      const base = merged.get(slug) ?? MEMBERSHIP_PLANS.find((p) => p.slug === slug);
      if (!base) continue;

      merged.set(slug, {
        ...base,
        planId: row.id,
        name: row.name,
        description: row.description ?? base.description,
        priceCents: row.price_cents,
        priceLabel: formatPriceLabel(row.price_cents),
        interval: row.interval === "year" ? "year" : "month",
        stripePriceId: row.stripe_price_id,
      });
    }

    return Array.from(merged.values());
  } catch {
    return MEMBERSHIP_PLANS;
  }
}

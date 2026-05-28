import type { PartnerType } from "@/types/domain";
import { getSupabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";

export type PublicPartnerProfile = {
  id: number;
  name: string;
  type: PartnerType;
  address: string | null;
  city: string | null;
  country: string | null;
  services: string[];
  createdAt: string;
};

const PROFILE_SELECT =
  "id, name, type, address, city, country, services, created_at";

type PartnerProfileRow = {
  id: number;
  name: string;
  type: PartnerType;
  address: string | null;
  city: string | null;
  country: string | null;
  services: string[] | null;
  created_at: string;
};

export function parsePartnerRouteId(raw: unknown): number | null {
  let segment: string | undefined;
  if (typeof raw === "string") segment = raw;
  else if (Array.isArray(raw) && typeof raw[0] === "string") segment = raw[0];
  else return null;

  const trimmed = segment.trim();
  if (!trimmed) return null;

  const id = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}

export async function fetchActivePartnerById(
  partnerId: number,
): Promise<PublicPartnerProfile | null> {
  if (!isSupabaseServerConfigured()) {
    console.error("[fetchActivePartnerById] Supabase is not configured");
    return null;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("partners")
    .select(PROFILE_SELECT)
    .eq("id", partnerId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[fetchActivePartnerById]", error.message);
    return null;
  }

  if (!data) return null;

  const row = data as PartnerProfileRow;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    city: row.city,
    country: row.country,
    services: row.services ?? [],
    createdAt: row.created_at,
  };
}

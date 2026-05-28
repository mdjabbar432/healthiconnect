import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";

export async function ensureUniqueDoctorSlug(
  admin: SupabaseClient,
  fullName: string,
): Promise<string> {
  const base = slugify(fullName) || "doctor";
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const { data } = await admin
      .from("doctors")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

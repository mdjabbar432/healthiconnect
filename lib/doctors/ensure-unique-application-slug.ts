import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";

/** Unique slug across doctors and doctor_applications (for dev draft intake). */
export async function ensureUniqueApplicationSlug(
  admin: SupabaseClient,
  fullName: string,
): Promise<string> {
  const base = slugify(fullName) || "doctor";
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const [{ data: doctorHit }, { data: appHit }] = await Promise.all([
      admin.from("doctors").select("id").eq("slug", candidate).maybeSingle(),
      admin
        .from("doctor_applications")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle(),
    ]);

    if (!doctorHit && !appHit) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

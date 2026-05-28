import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  getSupabaseAdmin,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server"; 

type FeaturedDoctorRow = {
  id: string;
  slug: string;
  profiles:
    | { full_name?: string | null }
    | Array<{ full_name?: string | null }>
    | null;
  doctor_specialties?: Array<{
    specialties:
      | { name?: string | null }
      | Array<{ name?: string | null }>
      | null;
  } | null> | null;
};

function rowFullName(profile: FeaturedDoctorRow["profiles"]) {
  if (!profile) return "";
  if (Array.isArray(profile)) return profile[0]?.full_name ?? "";
  return profile.full_name ?? "";
}

function rowPrimarySpecialty(row: FeaturedDoctorRow): string {
  const first = row.doctor_specialties?.[0];
  const spec = first?.specialties;
  if (!spec) return "Verified specialist";
  if (Array.isArray(spec)) return spec[0]?.name ?? "Verified specialist";
  return spec.name ?? "Verified specialist";
}

export async function FeaturedDoctors() {
  if (!isSupabaseServerConfigured()) {
    return (
      <div className="text-center p-10 bg-red-50 text-red-600">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
        SUPABASE_SERVICE_ROLE_KEY to .env.local.
      </div>
    );
  }

  try {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <div className="text-center p-10 bg-red-50 text-red-600">
        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
        SUPABASE_SERVICE_ROLE_KEY to .env.local.
      </div>
    );
  }

  const primary = await admin
    .from("doctors")
    .select(
      "id, slug, profiles!doctors_id_fkey(full_name), doctor_specialties(specialties(name))",
    )
    .eq("status", "approved")
    .limit(3);

  const specialistsResult = primary.error
    ? await admin
        .from("doctors")
        .select(
          "id, slug, profiles(full_name), doctor_specialties(specialties(name))",
        )
        .eq("status", "approved")
        .limit(3)
    : primary;

  const specialists = specialistsResult.data;
  const error = specialistsResult.error;

  // ১. যদি ডাটাবেস থেকে কোনো এরর আসে তবে স্ক্রিনে সেটি দেখাবে
  if (error) {
    console.error("Supabase Error:", error);
    return (
      <div className="text-center p-10 bg-red-50 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  // ২. যদি ডাটাবেসে কোনো ডাক্তার না পাওয়া যায় তবে এটি দেখাবে
  if (!specialists || specialists.length === 0) {
    return (
      <div className="text-center p-10 bg-yellow-50 text-yellow-700">
        No doctors found with 'approved' status.
      </div>
    );
  }

  return (
    <div className="hc-band hc-band--muted">
      <section className="hc-section hc-featured-docs-inner" aria-labelledby="featured-doctors-heading">
        <div className="hc-section__narrow">
          <h2 id="featured-doctors-heading" className="hc-section__title">
            Meet Our Top Specialists
          </h2>
          <p className="hc-section__lead">
            Highly rated clinicians available for appointments.
          </p>
        </div>
        <div className="hc-featured-docs__grid">
          {(specialists as FeaturedDoctorRow[]).map((doctor) => (
            <article key={doctor.id} className="hc-doctor-card">
              <div className="hc-doctor-card__image-wrap">
                <Image
                  src="/assets/images/placeholder-doctor.svg"
                  alt=""
                  fill
                  unoptimized
                  className="hc-doctor-card__image"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="hc-doctor-card__badge">
                  <Star
                    className="hc-doctor-card__badge-icon"
                    aria-hidden
                    strokeWidth={2}
                    fill="currentColor"
                  />
                  Top Rated
                </span>
              </div>
              <div className="hc-doctor-card__body">
                <h3 className="hc-doctor-card__name">
                  {rowFullName(doctor.profiles) || "Doctor"}
                </h3>
                <p className="hc-doctor-card__specialty">
                  {rowPrimarySpecialty(doctor)}
                </p>
                <Link
                  href={`/doctors/${doctor.id}`}
                  className="hc-btn hc-btn--primary hc-doctor-card__cta"
                >
                  View profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
  } catch (cause) {
    console.error("[FeaturedDoctors]", cause);
    return (
      <div className="text-center p-10 bg-red-50 text-red-600">
        Unable to load featured doctors. Please refresh the page.
      </div>
    );
  }
}